interface IpcDownloadMsg {
  downUrl: string

  /**
   * `start${replyId}`
   * `done${replyId}`
   * `pause${replyId}`
   * `progressing${replyId}`
   * `failed${replyId}`
   * * * * --`interrupted${replyId}`--
   */
  replyId: string
  folderPath?: string
}
