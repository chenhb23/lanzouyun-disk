
interface Task {
  status: 'uploading' | 'pause'
}

interface SubTask {
  status: 'uploading' | 'pause'
  isFinish: boolean
}

export default abstract class Manager {
  abstract addTask(...args)

  abstract start(...args)

  abstract startAll()

  abstract pause(...args)

  abstract pauseAll()

  abstract del(...args)

  abstract delAll()
}

