const project = {
  lanzouUrl: 'https://pc.woozooo.com',
  page: {
    home: '/mydisk.php',
    login: '/account.php?action=login',
  },
  api: {
    task: '/doupload.php',
  },
  supportListStr:
    'doc,docx,zip,rar,apk,ipa,txt,exe,7z,e,z,ct,ke,cetrainer,db,tar,pdf,w3x,epub,mobi,azw,azw3,osk,osz,xpa,cpk,lua,jar,dmg,ppt,pptx,xls,xlsx,mp3,ipa,iso,img,gho,ttf,ttc,txf,dwg,bat,imazingapp,dll,crx,xapk,conf,deb,rp,rpm,rplib,mobileconfig,appimage,lolgezi,flac,cad,hwt,accdb,ce,xmind,enc,bds,bdi,ssf,it,pkg,cfg',
  // https://en.wikipedia.org/wiki/List_of_file_signatures
  safeSuffixList: [
    'ct',
    'ke',
    // 'cetrainer', // 不能上传
    'w3x',
    'mobi',
    'azw',
    'azw3',
    'osk',
    'osz',
    'xpa',
    'cpk',
    'lua',
    'gho',
    'ttc',
    'txf',
    'bat',
    'imazingapp',
    'xapk',
    'conf',
    'rp',
    'rplib',
    'mobileconfig',
    'appimage',
    'lolgezi',
    'cad',
    'hwt',
    'ce',
    'xmind',
    'bds',
    'bdi',
    'ssf',
    'it',
    'pkg',
    'cfg',
  ],
}

export const supportList = project.supportListStr.split(',')

export default project
