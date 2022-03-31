function w_info(inf) {
  // hello
  $('#wring').html(inf)
  $('#wring').animate({top: '30px'}, 150, function() {
    setTimeout('$("#wring").css("top","-100px");', 2000)
  })
}

function folkey(folid) {
  $('#folks' + folid).show()
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    // data: {'task': 18, 'folder_id': folid},
    data: {task: 18, 'folder_id': folid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        $('#folks' + folid).html('<div>密码：</div><div class="finfost">' + msg.info.pwd + '</div>')
      } else {
        w_info('获取失败，请重试')
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })
}

function folkeycl(folid) {
  $('#folks' + folid).hide(150)
}

function fkey(fid) {
  $('#fks' + fid).show()
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 22, 'file_id': fid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        $('#fks' + fid).html('<div>密码：</div><div class="finfost">' + msg.info.pwd + '</div>')
      } else {
        w_info('获取失败，请重试')
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })
}

function fkeycl(fid) {
  $('#fks' + fid).hide(150)
}

function finfo(fid) {
  $('#fis' + fid).show()
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 12, 'file_id': fid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        $('#fis' + fid).html('<div class="finfost">' + msg.text + '</div><div>' + msg.info + '</div>')
      } else {
        w_info('获取失败，请重试')
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })
}

function file_lock(fid) {
  $('#file_lock').show(150)
}

function file_lockcl(fid) {
  $('#file_lock').hide(150)
}

function file_lock2(fid) {
  $('#file_lock2').show(150)
}

function file_lockcl2(fid) {
  $('#file_lock2').hide(150)
}

function file_lock3(fid) {
  $('#file_lock3').show(150)
}

function file_lockcl3(fid) {
  $('#file_lock3').hide(150)
}

function finfocl(fid) {
  $('#fis' + fid).hide(150)
}

function f_pwd(fid) {
  $('div#f_pwd').show(150)
  $('#f_pwdid').val(fid)
  $('#f_pwdonof').val('')
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 22, 'file_id': fid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        if (msg.info.onof == 1) {
          //on
          $('.f_pwd2').show()
          $('#f_pwdonof').val('1')
          $('#file_pwd').val(msg.info.pwd)
          $('.f_pwdoff').hide()
          $('.f_pwdon').show()
        } else {
          $('.f_pwd2').hide()
          $('#f_pwdonof').val('0')
          $('#file_pwd').val(msg.info.pwd)
          $('.f_pwdon').hide()
          $('.f_pwdoff').show()
        }
        $('#f_nowid').text(msg.info.is_newd + '/' + msg.info.f_id)
        $('#nowpwd').text(msg.info.pwd)
      } else {
        w_info('获取失败，请重试')
        $('div#f_pwd').hide()
      }
    },
    error: function() {
      w_info('获取失败，请重试')
      $('div#f_pwd').hide()
    },

  })
}

function fol_pwd(folid) {
  $('div#fol_pwd').show(150)
  $('#fol_pwdid').val(folid)
  $('#fol_pwdonof').val('')
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 18, 'folder_id': folid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        if (msg.info.onof == 1) {
          //on
          $('.fol_pwd2').show()
          $('#fol_pwdonof').val('1')
          $('#folder_pwd').val(msg.info.pwd)
          $('.fol_pwdoff').hide()
          $('.fol_pwdon').show()
        } else {
          $('.fol_pwd2').hide()
          $('#fol_pwdonof').val('0')
          $('#folder_pwd').val(msg.info.pwd)
          $('.fol_pwdon').hide()
          $('.fol_pwdoff').show()
        }

        //$("#fol_nowid").text(msg.info.is_newd+'/b'+folid+'/');
        $('#fol_nowid').text(msg.info.new_url)
        $('#fol_nowpwd').text(msg.info.pwd)
      } else {
        w_info('获取失败，请重试')
        $('div#fol_pwd').hide()
      }
    },
    error: function() {
      w_info('获取失败，请重试')
      $('div#fol_pwd').hide()
    },

  })
}

function f_pwdtongle() {
  var onof = $('#f_pwdonof').attr('value')
  if (onof == 1) {
    //on -> off
    $('.f_pwdon').hide()
    $('.f_pwdoff').show()
    $('.f_pwd2').hide(100)
    $('#f_pwdonof').val('0')
  } else {
    $('.f_pwdoff').hide()
    $('.f_pwdon').show()
    $('.f_pwd2').show()
    $('#f_pwdonof').val('1')
  }
}

function fol_pwdtongle() {
  var onof = $('#fol_pwdonof').attr('value')
  if (onof == 1) {
    //on -> off
    $('.fol_pwdon').hide()
    $('.fol_pwdoff').show()
    $('.fol_pwd2').hide(100)
    $('#fol_pwdonof').val('0')
  } else {
    $('.fol_pwdoff').hide()
    $('.fol_pwdon').show()
    $('.fol_pwd2').show()
    $('#fol_pwdonof').val('1')
  }
}

function f_pwdgo() {
  $('#f_pwdgo').disabled = true

  $('#f_pwdgo').value = '正在提交中'
  var pwd = $('#file_pwd').attr('value')
  var onof = $('#f_pwdonof').attr('value')
  var fid = $('#f_pwdid').attr('value')
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 23, 'file_id': fid, 'shows': onof, 'shownames': pwd},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        $('div#f_pwd').hide(150)
        $('#f_pwdgo').disabled = false
        $('#f_pwdgo').value = '保存'
        w_info(msg.info)
        if (msg.text == 1) {
          $('#fk' + fid).show()
        } else {
          $('#fk' + fid).hide()
        }

      } else {
        w_info(msg.info)
        $('#f_pwdgo').disabled = false
        $('#f_pwdgo').value = '保存'
      }
    },
    error: function() {
      w_info(msg.info)
      $('#f_pwdgo').disabled = false
      $('#f_pwdgo').value = '保存'
    },

  })
}

function fol_pwdgo() {
  $('#fol_pwdgo').disabled = true

  $('#fol_pwdgo').value = '正在提交中'
  var pwd = $('#folder_pwd').attr('value')
  var onof = $('#fol_pwdonof').attr('value')
  var folid = $('#fol_pwdid').attr('value')
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 16, 'folder_id': folid, 'shows': onof, 'shownames': pwd},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        $('div#fol_pwd').hide(150)
        $('#fol_pwdgo').disabled = false
        $('#fol_pwdgo').value = '保存'
        w_info(msg.info)
      } else {
        w_info(msg.info)
        $('#fol_pwdgo').disabled = false
        $('#fol_pwdgo').value = '保存'
      }
      if (msg.text == 1) {
        $('#folk' + folid).show()
      } else {
        $('#folk' + folid).hide()
      }
    },
    error: function() {
      w_info(msg.info)
      $('#fol_pwdgo').disabled = false
      $('#fol_pwdgo').value = '保存'
    },

  })
}

function fol_cre() {
  $('#fol_cre').show(150)
}

function fol_crego() {
  $('#fol_crego').disabled = true

  $('#fol_crego').value = '正在提交中'
  var folder_name = $('#fol_crename').attr('value')
  var folder_description = $('#fol_credes').attr('value')
  var folder_id = $('#folder_id_bibao').attr('value')
  if (folder_id < 0) {
    var parent_id = 0
  } else {
    var parent_id = folder_id
  }
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 2, 'parent_id': parent_id, 'folder_name': folder_name, 'folder_description': folder_description},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        $('div#fol_cre').hide(150)
        w_info(msg.info)
        //setTimeout('location.reload();',500);
        var fol_id = msg.text
        //$.each(data, function(i, n){
        var str
        var is_folpwd
        var filelock
        var is_lock
        var folder_sel
        var folder_des
        is_folpwd = '&nbsp;<span onmouseover=folkey(' + fol_id + '); onMouseOut=folkeycl(' + fol_id + '); class=fkey id=folk' + fol_id + ' style=display:initial></span><span class=finfos id=folks' + fol_id + '></span>'
        filelock = ''
        is_lock = ''
        folder_des = ''
        folder_sel = '<div class=f_sel>'
        folder_sel += '<a onclick=fol_view(' + fol_id + ') onblur=fol_onblur(' + fol_id + '); tabindex=' + fol_id + ' id=folse' + fol_id + ' class=f_sela><span></span><span></span><span></span></a>'
        folder_sel += '<a onclick=fol_dv(' + fol_id + ')  href=javascript:void(0); onblur=fol_onblurd(' + fol_id + '); class=f_selb></a>'
        folder_sel += '<div id=fols' + fol_id + ' class=f_selc element-invisible></div>'
        folder_sel += '<div id=fols_d' + fol_id + ' class=f_selcd element-invisible></div>'
        folder_sel += '</div>'
        str = '<div class=f_tb id=fol' + fol_id + '><div class=f_name2><span onclick=folder(' + fol_id + ') class=follink><img src=images/folder_open.gif border=0 align=absmiddle />&nbsp;' + folder_name + '</span>' + is_folpwd + filelock + is_lock + folder_des + '</div>' + folder_sel + '</div>'
        $(str).appendTo('#sub_folder_list')
        //});
      } else {
        w_info(msg.info)
        $('#fol_crego').disabled = false
        $('#fol_crego').value = '保存'
      }
    },
    error: function() {
      w_info(msg.info)
      $('#fol_crego').disabled = false
      $('#fol_crego').value = '保存'
    },

  })
}

function fol_dec(folid) {
  $('div#fol' + folid).hide(150)
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 3, 'folder_id': folid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        w_info(msg.info)
      } else {
        w_info(msg.info)
        $('div#fol' + folid).show(150)
      }
    },
    error: function() {
      w_info('失败，请重试')
      $('div#fol' + folid).show(150)
    },

  })
}

function fol_view(folid) {
  $('a#folse' + folid).addClass('f_focus')
  //创建filelist
  $('#fols' + folid).html('<div class=f_view>' +
    '<div onclick="fol_sha(' + folid + ');" class=f_viewtop>外链分享地址</div>' +
    '<div onclick="f_diy(' + folid + ',2);">自定义外链</div>' +
    '<div onclick="fol_pwd(' + folid + ');">设置访问密码</div>' +
    '<div onclick="fol_des(' + folid + ');" class=f_viewbot>修改资料(话说)</div>' +
    '<div onclick="fol_surl(' + folid + ');">短网址<span style=color:#888></span></div>' +
    '</div>')
  $('#fols' + folid).removeClass('element-invisible')
}

function fol_onblur(folid) {
  $('a#folse' + folid).removeClass('f_focus')
  //隐藏filelist
  //$('#fs'+fid).addClass('element-invisible');
  //alert(fid);
  setTimeout(function() {
    $('#fols' + folid).addClass('element-invisible')
  }, 300)
}

function fol_sha(folid) {
  $('div#f_sha1').text('')
  $('div#code').text('')
  var url
  //url ='https://www.lanzous.com/b'+ folid;
  $('div#f_sha').show(150)
  $('div#f_sha1').text(url)
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 18, 'folder_id': folid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        if (msg.info.onof == 1) {
          //on
          //url = msg.info.is_newd+'/b' + folid +'/ <br>密码:'+msg.info.pwd + msg.info.taoc;
          url = msg.info.new_url + ' <br>密码:' + msg.info.pwd + msg.info.taoc
          $('div#f_sha1').html(url)
        } else {
          //tcns
          //tcns(folid);
          //url =msg.info.is_newd +'/b'+ folid +'/' + msg.info.taoc;
          url = msg.info.new_url
          $('div#f_sha1').html(url)
        }
        url = msg.info.new_url
        var qrcode = new QRCode('code', {
          text: url,
          width: 190,
          height: 190,
          colorDark: '#3f3f3f',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H,
        })
      } else {
        w_info('获取失败，请重试')
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })

}

function fol_des(folid) {
  document.getElementById('fol_desid').value = folid
  $('div#fol_des').show(150)
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 18, 'folder_id': folid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        document.getElementById('folder_descname').value = msg.info.name
        document.getElementById('folder_descdes').value = msg.info.des
      } else {
        w_info('获取失败，请重试')
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })
}

function f_ico(fid) {
  var bgimg = document.getElementById('selectfiles')
  $('div#f_ico').show(150)
  //清空上传记录
  $('div#ossfile').html('')
  bgimg.style.cssText = 'background: #fff;'
  //js设置cookie ,
  var Days = 30
  var exp = new Date()
  exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000)
  //var valuecookie;
  //document.cookie = 'file_id_ico' + "="+ escape (msg.info) + ";expires=" + exp.toGMTString();
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 41, 'file_id': fid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        //valuecookie = msg.text;
        bgimg.style.cssText = 'background: url(' + msg.info[1] + ');background-size: 100%;background-repeat: no-repeat;background-position: 50%;'
        document.cookie = 'file_id_ico' + '=' + escape(msg.info[0]) + ';expires=' + exp.toGMTString()


      } else if (msg.zt == '0') {
        //没有上传，
        document.cookie = 'file_id_ico' + '=' + escape(msg.info[0]) + ';expires=' + exp.toGMTString()
      } else {
        $('div#container1').hide()
        $('div#f_ico_info').show()
        $('div#f_ico_info').html(msg.info)
        w_info(msg.info)
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })
}

function fol_desgo() {
  $('#fol_desgo').val('保存中...')
  var name = $('#folder_descname').attr('value')
  var desc = $('#folder_descdes').attr('value')
  var folid = $('#fol_desid').attr('value')
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 4, 'folder_id': folid, 'folder_name': name, 'folder_description': desc},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        $('#fol_desgo').val('保存')
        $('div#fol_des').hide(150)
        w_info(msg.info)
        $('#folname' + folid).text(name)
      } else {
        w_info(msg.info)
        $('#fol_desgo').val('保存')
      }
    },
    error: function() {
      w_info(msg.info)
      $('#fol_desgo').val('保存')
    },

  })
}


function f_dec(fid) {
  $('div#f' + fid).hide(150)
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 6, 'file_id': fid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        w_info(msg.info)
      } else {
        w_info('失败，请重试')
        $('div#f' + fid).show(150)
      }
    },
    error: function() {
      w_info('失败，请重试')
      $('div#f' + fid).show(150)
    },

  })
}

function f_onblur(fid) {
  $('a#fse' + fid).removeClass('f_focus')
  //隐藏filelist
  //$('#fs'+fid).addClass('element-invisible');
  //alert(fid);
  setTimeout(function() {
    $('#fs' + fid).addClass('element-invisible')
  }, 300)
}

function f_view(fid) {
  $('a#fse' + fid).addClass('f_focus')
  //创建filelist
  $('#fs' + fid).html('<div class=f_view>' +
    '<div onclick="f_sha(' + fid + ');" class=f_viewtop>外链分享地址</div>' +
    '<div onclick="f_diy(' + fid + ',1);">自定义外链</div>' +
    '<div onclick="f_ico(' + fid + ',1);">缩略图 <span style=color:#888> 图标</span></div>' +
    '<div onclick="f_ename(' + fid + ');">重命名</div>' +
    '<div onclick="f_midf(' + fid + ');">移动</div>' +
    '<div onclick="f_pwd(' + fid + ');">设置访问密码</div>' +
    '<div onclick="f_des(' + fid + ');">添加描述</div>' +
    '<div onclick="f_surl(' + fid + ');">短网址<span style=color:#888></span></div>' +
    '<div onclick="f_url(' + fid + ');" class=f_viewbot>文件直链</div>' +
    '</div>')
  $('#fs' + fid).removeClass('element-invisible')
}

function f_sha(fid) {
  $('div#f_sha1').text('')
  $('div#code').text('')
  var url
  url = 'http' + isssl + '://pan.lanzou.com/' + fid + '/'
  $('div#f_sha').show(150)
  $('div#f_sha1').text('获取中...')

  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 22, 'file_id': fid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        if (msg.info.onof == 1) {
          //on
          url = msg.info.is_newd + '/' + msg.info.f_id + '<br>密码:' + msg.info.pwd + msg.info.taoc
          //urls ='http'+ isssl +'://pan.lanzou.com/' + msg.info.f_id;
          url_d = msg.info.is_newd + '/' + msg.info.f_id
          code_suc(url_d)
          $('div#f_sha1').html(url)
        } else {
          //无密码
          //t.cn
          //tcn(msg.info.f_id);
          url = msg.info.is_newd + '/' + msg.info.f_id + msg.info.taoc
          //urls ='http'+ isssl +'://pan.lanzou.com/' + msg.info.f_id;
          url_d = msg.info.is_newd + '/' + msg.info.f_id
          code_suc(url_d)
          $('div#f_sha1').html(url)
        }
        url = msg.info.is_newd + '/' + msg.info.f_id
      } else {
        w_info('获取失败，请重试')
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })

}

function code_suc(f_id) {
  var urls = f_id
  var qrcode = new QRCode('code', {
    text: urls,
    width: 190,
    height: 190,
    colorDark: '#3f3f3f',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  })
}

function tcn(fid) {
  //t.cn
  url = 'https://lanzous.com/' + fid + '/'
  $.ajax({
    type: 'post',
    url: '/tcn.php?url=' + url,
    data: {'t': 1},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        url = '<div class=f_tcn>' + msg.info + '</div>http' + isssl + '://lanzous.com/' + fid
        $('div#f_sha1').html(url)
      } else {
        w_info('获取失败，请重试')
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })
}

function tcns(fid) {
  //t.cn
  url = 'https://lanzous.com/b' + fid + '/'
  $.ajax({
    type: 'post',
    url: '/tcn.php?url=' + url,
    data: {'t': 1},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        url = '<div>' + msg.info + '</div>'
        $('div#f_sha1').html(url)
      } else {
        w_info('获取失败，请重试')
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })
}

//头像/缩略图上传回调
function img_ajax(stx, type) {
  //userimg/201812/13/123-Dkdk3ks.png
  //alert(stx);
  var type = type
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 38, 'img': stx, 'type': type},//1头像，2缩略图
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        w_info(msg.info[0])
        var bgimg = document.getElementById('selectfiles')
        bgimg.style.cssText = 'background: url(' + msg.info[1] + ');background-size: 100%;background-repeat: no-repeat;background-position: 50%;'
        //setTimeout("ref();",1000);
        if (type == 2) {
          var s = stx
          var ss, sss, fid
          ss = s.split('/')
          ss = ss[4]
          sss = ss.split('-')
          fid = sss[0]
          $('#icoimg' + fid).hide()//{"background-color":"yellow","font-size":"200%"}
          $('#ico' + fid).css({
            'background': 'url(' + msg.info[1] + ')',
            'background-size': '70%',
            'background-repeat': 'no-repeat',
            'background-position': '50%',
            'display': 'initial',
          })
        }
      } else {
        w_info(msg.info)
      }
    },
    error: function() {
      w_info('系统繁忙，请重试')
    },

  })
}

function f_des(fid) {
  document.getElementById('f_desid').value = fid
  $('div#f_des').show(150)
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 12, 'file_id': fid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        document.getElementById('file_desc').value = msg.info
      } else {
        w_info('获取失败，请重试')
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })
}

function f_desgo() {
  $('#f_desgo').val('保存中...')
  var desc = $('#file_desc').attr('value')
  var fid = $('#f_desid').attr('value')
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 11, 'file_id': fid, 'desc': desc},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        $('#f_desgo').val('保存')
        $('div#f_des').hide(150)
        w_info(msg.info)
        $('#fi' + fid).show()
      } else {
        w_info(msg.info)
        $('#f_desgo').val('保存')
      }
    },
    error: function() {
      w_info(msg.info)
      $('#f_desgo').val('保存')
    },

  })
}

function f_surl(fid) {
  $('#durls').val('')
  $('div#f_surl').show(150)
  //url ='https://pan.lanzou.com/'+ fid;
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 22, 'file_id': fid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        var url = msg.info.is_newd + '/' + msg.info.f_id + '?t'
        $.ajax({
          type: 'post',
          url: '/tcn.php?url=' + url,
          data: {'t': 1},
          dataType: 'json',
          success: function(msg) {
            if (msg.zt == '1') {
              //success
              $('#durls').val(msg.info)
            } else {
              w_info('获取失败，请重试')
            }
          },
          error: function() {
            w_info('获取失败，请重试')
          },

        })
      } else {
        w_info('获取失败，请重试')
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })
}

function fol_surl(fid) {
  $('#durls').val('')
  $('div#f_surl').show(150)
  //url ='https://pan.lanzou.com/'+ fid;
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 18, 'folder_id': fid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        var url = msg.info.new_url + '?t'
        $.ajax({
          type: 'post',
          url: '/tcn.php?url=' + url,
          data: {'t': 1},
          dataType: 'json',
          success: function(msg) {
            if (msg.zt == '1') {
              //success
              $('#durls').val(msg.info)
            } else {
              w_info('获取失败，请重试')
            }
          },
          error: function() {
            w_info('获取失败，请重试')
          },

        })
      } else {
        w_info('获取失败，请重试')
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })
}

function sendpwd() {
  var pwd = $('#file_pwd').val()
  $('#nowpwd').text(pwd)
}

function sendpwds() {
  var pwd = $('#folder_pwd').val()
  $('#fol_nowpwd').text(pwd)
}

function f_url(fid) {
  //w_info('非常抱歉，此功能等待上线');
  $('div#f_linkcdn').show(150)
  $('#f_linkcdn_info').html('')
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 31, 'file_id': fid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        $('#f_linkcdn_info').html(msg.info)
      } else if (msg.zt == '2') {
        $('div#f_linkcdn_info').hide()
        $('div#f_linkcnd_txt').show()
        $('#f_linkcnd_txt').html(msg.info)
      } else {
        w_info('获取失败，请重试')
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })
}

function f_wring(fid) {
  $('#f_wring').show()
  $('#f_wringurl').text(fid)
}

function f_midf(fid) {
  $('div#f_midf').show(150)
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 19, 'file_id': fid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        $('#f_midf1').html('<div class=f_midf6 onclick=\'f_midfgo(-1,' + fid + ');\'><div class=f_midf5></div><img src=/images/folder_open.gif align=absmiddle border=0>&nbsp;根目录</div>')
        var data = msg.info
        $.each(data, function(i, n) {
          var row = $('#f_midf3').clone()
          row.find('#f_midf4').html('<div class=f_midf6 onclick=\'f_midfgo(' + n.folder_id + ',' + fid + ');\'><div class=f_midf5></div><img src=/images/folder_open.gif align=absmiddle border=0>&nbsp;' + n.folder_name + '</div>')
          row.attr('id', 'readyf')
          row.appendTo('#f_midf1')
        })
      } else {
        w_info('获取失败，请重试')
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })
}

function f_midfgo(fol_id, fid) {
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 20, 'folder_id': fol_id, 'file_id': fid},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        w_info(msg.info)
        $('div#f_midf').hide(150)
        $('#f' + fid).hide(150)
        w_info(msg.info)
      } else {
        w_info(msg.info)
      }
    },
    error: function() {
      w_info(msg.info)
    },

  })
}

function f_diy(fid, stx) {
  $('div#f_diy_info').text('')
  $('div#f_diy').show(150)
  $('div#f_diy_info').text('获取中...')
  document.getElementById('f_diy_id').value = fid
  document.getElementById('f_diy_type').value = stx
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 39, 'file_id': fid, 'type': stx},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        $('div#f_diy_box').show(150)
        $('div#f_diy_set').hide(150)
        $('div#f_diy_info').html(msg.info)
      } else if (msg.zt == '2') {
        document.getElementById('f_diy_input').value = ''
        $('div#f_diy_set').show(150)
        $('div#f_diy_box').hide(150)
        $('div#f_diy_domain').html(msg.info)
      } else {
        w_info(msg.info)
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })

}

function f_diygo() {
  var f_diy = $('#f_diy_input').attr('value')
  var fid = $('#f_diy_id').attr('value')
  var type = $('#f_diy_type').attr('value')
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 40, 'file_id': fid, 'diy': f_diy, 'type': type},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        $('div#f_diy_box').show(150)
        $('div#f_diy_set').hide(150)
        $('div#f_diy_info').html(msg.info)
      } else if (msg.zt == '2') {
        w_info(msg.info)
      } else {
        w_info(msg.info)
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })

}

function f_ename(fid) {
  $('div#f_ename').show(150)
  document.getElementById('f_ename_id').value = fid
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 46, 'file_id': fid, 'type': 1},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        document.getElementById('f_ename_new').value = msg.info
      } else {
        w_info(msg.info)
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })

}

function f_enamego() {
  var fid = $('#f_ename_id').attr('value')
  var stx = $('#f_ename_new').attr('value')
  $.ajax({
    type: 'post',
    url: '/doupload.php',
    data: {'task': 46, 'file_id': fid, 'file_name': stx, 'type': 2},
    dataType: 'json',
    success: function(msg) {
      if (msg.zt == '1') {
        //success
        w_info('修改成功')
        $('#filename' + fid).text(msg.info)
        f_cl('ename')
      } else {
        w_info(msg.info)
      }
    },
    error: function() {
      w_info('获取失败，请重试')
    },

  })

}

function f_dv(fid) {
  //创建f_dec_viewlist
  $('#fs_d' + fid).html('<div class=f_view>' +
    '<div onclick="f_dec(' + fid + ');" class=f_viewtop><span class=redcolor>删除文件</span></div>' +
    '<div onclick="f_onblurd(' + fid + ');" class=f_viewbot>取消</div>')
  $('#fs_d' + fid).removeClass('element-invisible')
}

function f_onblurd(fid) {
  //隐藏
  //$('#fs'+fid).addClass('element-invisible');
  setTimeout(function() {
    $('#fs_d' + fid).addClass('element-invisible')
  }, 300)
}

function fol_dv(folid) {
  //创建f_dec_viewlist
  $('#fols_d' + folid).html('<div class=f_view>' +
    '<div onclick="fol_dec(' + folid + ');" class=f_viewtop><span class=redcolor>删除文件</span></div>' +
    '<div onclick="fol_onblurd(' + folid + ');" class=f_viewbot>取消</div>')
  $('#fols_d' + folid).removeClass('element-invisible')
}

function fol_onblurd(folid) {
  //隐藏
  //$('#fs'+fid).addClass('element-invisible');
  setTimeout(function() {
    $('#fols_d' + folid).addClass('element-invisible')
  }, 300)
}

function f_cl(el) {
  switch (el) {
    case 'sha':
      $('div#f_sha').hide(150)
      break
    case 'pwd':
      $('div#f_pwd').hide(150)
      break
    case 'surl':
      $('div#f_surl').hide(150)
      break
    case 'des':
      $('div#f_des').hide(150)
      break
    case 'foldes':
      $('div#fol_des').hide(150)
      break
    case 'folpwd':
      $('div#fol_pwd').hide(150)
      break
    case 'folcre':
      $('div#fol_cre').hide(150)
      break
    case 'midf':
      $('div#f_midf').hide(150)
      break
    case 'linkcdn':
      $('div#f_linkcdn').hide(150)
      break
    case 'diy':
      $('div#f_diy').hide(150)
      break
    case 'ico':
      $('div#f_ico').hide(150)
      break
    case 'ename':
      $('div#f_ename').hide(150)
      break
  }
}
