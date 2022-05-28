enum IpcEvent {
  // handle
  'dialog:showOpenDialog' = 'dialog:showOpenDialog',
  'shell:showItemInFolder' = 'shell:showItemInFolder',
  'shell:openExternal' = 'shell:openExternal',
  'shell:openPath' = 'shell:openPath',
  'shell:trashItem' = 'shell:trashItem',

  // on
  logout = 'logout',

  // theme
  'theme:setTheme' = 'theme:setTheme',
  'theme:getTheme' = 'theme:getTheme',
}

export default IpcEvent
