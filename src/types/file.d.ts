interface IpcDownloadMsg {
  downUrl: string

  /**
   * `start${replyId}`
   * `done${replyId}`
   * `progressing${replyId}` receivedByte, totalBytes
   * `failed${replyId}`
   // * `pause${replyId}`
   // * `interrupted${replyId}`
   */
  replyId: string
  folderPath?: string
}
