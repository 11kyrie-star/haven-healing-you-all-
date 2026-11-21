type MessageStatus = 'done' | 'pending' | 'stopped' | 'error'

type message = {
  id: number
  from: string
  content: string
  time: string
  status?: MessageStatus
}

// 首字节超时：从发出请求到收到第一个字，允许的最长等待时间
const FIRST_BYTE_TIMEOUT = 20000
// 静默超时：已经开始输出后，多久没收到新的业务数据就判超时（心跳不算业务数据）
const IDLE_TIMEOUT = 30000

export type StreamResult = 'done' | 'stopped' | 'timeout' | 'error'

export async function streamrequest(
  history: message[],
  addmessage: (message: string) => void,
  signal: AbortSignal,
): Promise<StreamResult> {
  const token = localStorage.getItem('token')
  if (!token) return 'error'

  const requestMessages = history.filter((message) => {
    if (message.from === 'user') return true
    if (message.from === 'ai') return message.status === 'done'
    return false
  })

  // 本地 controller：用户停止和看门狗超时都收敛到这一个出口，
  // 因为 fetch 的 signal 只能接收一个 AbortSignal
  const local = new AbortController()
  const forward = () => local.abort(signal.reason)
  if (signal.aborted) forward()
  else signal.addEventListener('abort', forward, { once: true })

  // 看门狗：同一时刻只保留一个定时器，每收到一块业务数据就重置
  let timer: ReturnType<typeof setTimeout> | undefined
  let timedOut = false
  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  }
  const resetTimer = (ms: number) => {
    clearTimer()
    timer = setTimeout(() => {
      timedOut = true // 必须先打标记再中断，否则 catch 里分不清超时和用户主动停止
      local.abort()
    }, ms)
  }

  try {
    resetTimer(FIRST_BYTE_TIMEOUT)

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ messages: requestMessages }),
      signal: local.signal,
    })
    if (!response.ok) return 'error'

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      // 最后一段可能被网络切断，必须留到下一块拼接
      buffer = parts.pop() || ''

      for (const part of parts) {
        const line = part.trim()
        // 跳过心跳注释行（以冒号开头）和 event/id/retry 等非 data 字段
        if (!line.startsWith('data:')) continue
        const msg: { type: string; content?: string } = JSON.parse(line.slice(5).trimStart())
        if (msg.type === 'delta') {
          resetTimer(IDLE_TIMEOUT) // 只有真正的业务数据才续命，心跳不算
          addmessage(msg.content || '')
        } else if (msg.type === 'done') {
          return 'done'
        } else {
          return 'error'
        }
      }
    }

    // 循环结束却没收到 done 事件，说明后端提前断流
    return timedOut ? 'timeout' : 'error'
  } catch (err) {
    if (timedOut) return 'timeout'
    if (signal.aborted) return 'stopped'
    return 'error'
  } finally {
    clearTimer()
    signal.removeEventListener('abort', forward)
  }
}
