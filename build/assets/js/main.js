$(function () {
  Date.prototype.timeNow = function () {
    return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
  }

  // navigation
  var current = location.pathname;
  $('nav a.link').each(function(){
    var $this = $(this);
    // if the current path is like this link, make it active
    if($this.attr('href') === current)
      $this.addClass('active');
  });


  // print logo
  var logoHTML;
  var bankCode = getUrlParameter('bank');
  var cookieLogo = Cookies.get('logoHTML');
  if(bankCode)
    logoHTML = banksList[bankCode].name;

  if(logoHTML) 
    writeCookie('logoHTML', logoHTML, 1);
  else if(cookieLogo) 
    logoHTML = cookieLogo;

  if(logoHTML)
    $('.bankLogo span').html(logoHTML);
  
  // notification click
  $(document).on('click', '.actions em.active', function() {
    $('.notificationSet').toggle();
  });

  // print date
  if($('.curDate').length != 0) {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    var curtime = new Date().timeNow()
    today = dd + '/' + mm + '/' + yyyy + ' ' + curtime + ' UTC'
    $('.curDate').text(today);
  }
  // login form validation
  $("#loginForm").validate({
    rules: {
      emailAddress: { required: !0, email: !0 },
      password: { required: !0 }
    },
    messages: {
      emailAddress: { required: "Email required", email: "Invalid email" },
      password: { required: "Password required" }
    },
    submitHandler: function (form) {
      excelData('db.xlsx', 'users', onLogin);
      return !1;
    }
  });

  // login form show password
  $('#loginForm .showPassword').on('click', function () { 
    if ($('[name="password"]').attr('type') == 'password') {                   
      $('[name="password"]').prop('type', 'text');        
    } else {
      $('[name="password"]').prop('type', 'password');  
    }
  });

  $('#loginForm input').on('keyup blur', function () { 
    if ($('#loginForm').valid()) {                   
      $('button').prop('disabled', false);        
    } else {
      $('button').prop('disabled', 'disabled');  
    }
  });

  // dashboard data printing
  if($('.cardSection').length != 0) {
    var bank = Cookies.get('userBank');
    excelData('db.xlsx', `dashboard${bank}`, printDashboard);
  }

  $(document).on('click', '.cardCustom', function() {
    $('.cardCustom').removeClass('active');
    $(this).addClass('active');
  });

  // token transfer page
  if($('#transactionChart').length != 0) {
    var bank = Cookies.get('userBank');
    excelData('db.xlsx', bank, printTransactions);
  }
  
  $(document).on('click', '#filterSection a', function() {
    $('#filterSection a').removeClass('active');
    $('select#selectCurrency option[value=""]').attr("selected",true);
    $(this).addClass('active');

    var data = $(this).data('type');
    $('#transactionChart tbody tr').show();

    if(data) 
      $(`#transactionChart tbody tr.${data}`).hide();
    
  });
    
  $('select#selectCurrency').on('change', function() {
    $('#transactionChart tbody tr').hide();
    var cur = this.value;

    if(cur) 
      $(`#transactionChart tbody tr.${cur}`).show(); 
  });

  // send new transfer page
  $('#exampleModal').on('hidden.bs.modal', function () {
    $('.topSec input').val('IBAN')
    $('#exampleModal .modal-body .topSec .details').hide();
    $('#senderRef, #receiverRef').val('');
    $('#purpose').val('Invoice');
  })

  $(document).on('keyup', '#exampleModal .topSec input', function() {
    var elem = $(this).data("show");
    var refElem = $(this).data("ref");
    var type = (elem == 'senderDetails') ? 'Sender' : 'Receiver';
    var fieldValue = $(this).val();
    var details = '';

    if(fieldValue.length >= 13) {
      for(var item in recipientList) {
        if(recipientList[item]['iban'] === fieldValue) {
          details += '<div class="flag"><img class="' + type + 'ID" alt="' + recipientList[item]['id'] + '" src="images/icons/' + banksList[recipientList[item]['bank']].cur.toLowerCase() + '.svg" /> ' + recipientList[item]['country'] + '</div><ul><li><span>AC</span>' + recipientList[item]['account'] + '</li>';
          details += '<li><span>' + type + '</span>' + recipientList[item]['name'] + '</li>';
          details += '<li><span>Currency</span><em class="' + type + 'Currency">' + banksList[recipientList[item]['bank']].cur + '</em></li>';
          details += '<li><span>Bank</span>' + banksList[recipientList[item]['bank']].name + '</li></ul>';
          details += '<div class="address"><span>' + type + ' Address </span>' + recipientList[item]['address'] + '</div>';
          
          $(`#${elem}`).html(details).show(); 
          $(`#${refElem}`).val(`${banksList[recipientList[item]['bank']].name} / ${recipientList[item]['name']}`);
        }
      } 
    }
  });
  

  // submit add new
  $(document).on('click', '#exampleModal .approvalBtn', function() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    var curtime = new Date().timeNow()
    today = dd + '/' + mm + '/' + yyyy

    var senderIBAN = $('input[name="senderIBAN"]').val()
      , beneficiaryIBAN = $('input[name="beneficiaryIBAN"]').val()
      , amount = $('#senderAmount').val()
      , sheetName = Cookies.get('userBank')
      , transactionID = Math.floor(1000000000 + Math.random() * 9000000000)
      , senderCurrency = $('.SenderCurrency').text()
      , senderID = $('.SenderID').attr('alt')
      , recieverID = $('.ReceiverID').attr('alt')
      , id = Number($('#transactionChart tbody tr:first-child').attr('id')) + 1

    if(senderIBAN.length != 13 || beneficiaryIBAN.length != 13)
      alert('Invalid IBAN');
    if(amount.length == 1)
      alert('Please add amount');

    updateSheet(sheetName, '', '', [id, amount.slice(1), transactionID, 0, senderCurrency, senderID, recieverID, today, 'Outbound', curtime]);
  });
});

function printTransactions(data) {
  var tableHTML = ''; 
  var currency = banksList[Cookies.get('userBank')].currency;
  $('#senderAmount').val(currency); 

  if(data.length != 0) {
    data.reverse().map(function(rows) {  
      var statusClass = statusList[rows.status].class;
      var statusText = statusList[rows.status].status;
      var sheetName = Cookies.get('userBank');
      var position = `D${Number(rows.ID)+1}`;
      var receiverBank = recipientList[rows.reciever].bank;
      var senderBank = recipientList[rows.sender].bank;

      tableHTML += '<tr id="'+ rows.ID + '" class="' + rows.type.toLowerCase() + ' ' + rows.currency + '">';
      tableHTML += '<td><span>' + recipientList[rows.sender].name + '</span><br>' + banksList[recipientList[rows.sender].bank].name + '</td>';
      tableHTML += '<td><span>' + recipientList[rows.reciever].name + '</span><br>' + banksList[recipientList[rows.reciever].bank].name + '</td>';
      tableHTML += '<td>' + rows.transactionid + '</td><td>' + currency + ' ' + rows.amount + '</td><td>' + rows.date + '<span>' + rows.time + ' UTC</span></td>';
      
      tableHTML += '<td>' + rows.type + '</td><td><span class="' + statusClass + '">' + statusText + '</span></td><td>';

      if(rows.status === '2' || rows.status === '0') {
        var statusAction = (rows.status === '0') ? `1|${rows.ID},${rows.amount},${rows.transactionid},2,${rows.currency},${rows.sender},${rows.reciever},${rows.date},Inbound,${rows.time}|${receiverBank}` : `3|${rows.amount},${recipientList[rows.reciever].bank},${recipientList[rows.sender].bank}`;
        tableHTML += `<img onClick="updateSheet('${sheetName}', '${position}', '5')" src="images/icons/cross.png" /><img src="images/icons/check.png" onClick="updateSheet('${sheetName}', '${position}', '${statusAction}')" />`
      }
      if(rows.status === '3')
        tableHTML += `<img onClick="updateSheet('${sheetName}', '${position}', '4|${senderBank}|${rows.ID},${rows.amount},${receiverBank}')" src="images/icons/check2.png" />`
      tableHTML += '</td></tr>'; 
    }); 
  } else {
    tableHTML += '<tr id="0"><td colspan="9" align="center">No Records found</td></tr>'
  }

  $("#transactionChart tbody").html(tableHTML);
} 

function printDashboard(excelData) {
  var cardHTML = '';
  excelData.map(function(rows) { 
    var statusClass = (rows.status == 'decline') ? 'red' : (rows.status == 'approved') ? 'green' : '';
    var inStatusClass = (rows.inboundStatus == 'decline') ? 'red' : (rows.inboundStatus == 'approved') ? 'green' : '';
    cardHTML += '<div class="cardCustom"><div class="top clear"><div><img src="images/icons/' + rows.flag + '" />' + rows.currency + '</div></div>';
    cardHTML += '<table><tr><td width="50%">Total Tokens</td><td width="50%" class="right">' + rows.symbol + ' ' + rows.total + '</td></tr>'
    cardHTML += '<tr><td>Balance Available</td><td class="right balance">' + rows.symbol + ' ' + rows.balance + '</td></tr></table>';
    cardHTML += '<ul><li><i></i>Outbound <em class="' + statusClass + '">' + rows.status + '</em><span class="price">' + rows.symbol + ' ' + rows.outbound + '</span></li>';
    cardHTML += '<li><i class="orange"></i>Inbound <em class="' + inStatusClass + '">' + rows.inboundStatus + '</em><span class="price">' + rows.symbol + ' ' + rows.inbound + '</span></li></ul>';
    cardHTML += '<div class="cardActions"><a class="sendReport">Send Tokens</a><a class="redeemTokens">Redeem Tokens</a><a class="viewReport"> Statement</a></div></div>';
  }); 

  $(".cardSection").append(cardHTML);
}

function onLogin(excelData) {
  const emailAddress = $('input[name=emailAddress]').val();
  const password = $('input[name=password]').val();
  console.log(emailAddress, password, {excelData});
  
  var userData;
  for(var i=0; i<excelData.length;i++) {
    if((excelData[i].email === emailAddress) && (excelData[i].password === password)) {
      userData = excelData[i];
      break;
    }
  } 

  console.log({userData});
  if(userData && userData.password === password) {
    writeCookie('userName', emailAddress, 1);
    writeCookie('authorization', !0, 1);
    writeCookie('userBank', userData.bank, 1);
    writeCookie('userData', JSON.stringify(userData), 1);
    window.location.replace('/dashboard'); 
  } else {
    $('.warningInfo').show();
    setTimeout(function(){
      $('.warningInfo').fadeOut("slow");
    }, 3000);
  } 
}