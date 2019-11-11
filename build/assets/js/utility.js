function excelData(fileName, sheetName, callback) {
  var oReq = new XMLHttpRequest();
  oReq.open("GET", `${fileName}`, true);
  oReq.responseType = "arraybuffer";

  oReq.onload = function(e) {
    var arraybuffer = oReq.response;
    var data = new Uint8Array(arraybuffer);   /* convert data to binary string */

    var arr = new Array();
    for (var i = 0; i != data.length; ++i) 
      arr[i] = String.fromCharCode(data[i]);
    
    var bstr = arr.join("");
    var cfb = XLSX.read(bstr, { type: 'binary' });
    
    var fieldsObjs = XLS.utils.sheet_to_json(cfb.Sheets[sheetName]); 
    if(callback)
      callback(fieldsObjs);  
    // else
    //   return fieldsObjs 
  }

  // if(!callback) {
  //   let result = onload;
  //   return result;
  // }

  oReq.send();
}

function updateDashboard(sheetName, amount, type, otherSheet) {
  var url = `/updatesheet?sheetName=dashboard${sheetName}&amount=${amount}&type=${type}`;
  $.get(`${url}`, function() {
    if(type == 'revert') {
      setTimeout(function () {
        updateDashboard(otherSheet, amount, 'add');
      }, 2000);
      return false;
    }
    location.reload();
  });
}

function updateSheet(sheetName, pos, value, data) {
  var url = `/updatesheet?sheetName=${sheetName}`;
  value = value.split('|')

  if(data)
    url += `&data=${data}`;
  else
    url += `&pos=${pos}&value=${value[0]}`;

  $.get(`${url}`, function() {
    var socket = io();
    if(value[0] === '1') {
      socket.emit('addNew', sheetName);
      // write to other bank transactions history as Inbound
      setTimeout(function() {
        updateSheet(`${value[2]}`, '', '', value[1]);
      }, 2000);
      return;
    }
    if(value[0] === '3') {
      // Update dashboard of both banks
      setTimeout(function() {
        updateDashboard(`${value[1].split(',')[2]}`, value[1].split(',')[0], 'revert', `${value[1].split(',')[1]}`);
      }, 2000);
      return;
    }


    if(data) {
      if(!Array.isArray(data))
        data = data.split(',') 

      // Update sender bank dashboard
      if(data[8] === 'Inbound') {
        setTimeout(function() {
          updateDashboard(`${recipientList[data[5]].bank}`, data[1], '');
        }, 2000);
        return;
      }
    }
    if(value[0] === '4') { // Pending Confirmation Action
      if(value.length === 3) {
        setTimeout(function() {
          updateSheet(value[1], pos, `4|${value[2]}`);
          socket.emit('addNew', value[2]);
        }, 2000);
        return;
      }
      setTimeout(function() {
        updateDashboard(`${value[1].split(',')[2]}`, value[1].split(',')[1], 'add1');
      }, 2000);
      return;
    }

    if(value[0] === '2')
      updateSheet(sheetName, pos, '0');
    location.reload();
  });
}

function writeCookie(cookie, value, days) {
  var date, expires; 
  if (days) {
    date = new Date();
    date.setTime(date.getTime()+(days*24*60*60*1000));
    expires = "; expires="+date.toGMTString();
  } else 
    expires = "";
  document.cookie = `${cookie}=${value+expires}; path=/`;
};

function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

  for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
          return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
      }
  }
};