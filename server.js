const express = require('express'); 
const path = require('path'); 
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const fs = require("fs"); 
const io = require('socket.io')(http);
const xlsx = require('node-xlsx');
const auth = require('./build/middleware/auth');
const cookieParser = require("cookie-parser");
const ExcelJS = require('exceljs');

const pagesList = {
  'dashboard' : { page:'dashboard', title:'Dashboard' }
  , 'transfers' : { page:'transfers', title:'Token Transfer' }
}

app.set('views', __dirname + '/build/views');
app.set('view engine', 'ejs'); 
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, 'build/assets')));

app.get('/updatesheet', function(req, res) {
  const {query, query:{ sheetName, value, pos, data, amount, type}} = req;
  
  if(amount)
    updateDashboard('./build/assets/db.xlsx', sheetName, amount, type);
  else if(data)
    addTransaction('./build/assets/db.xlsx', sheetName, data);
  else
    editExcel('./build/assets/db.xlsx', sheetName, value, pos);
  res.send({query});
});

function updateDashboard(fileName, sheetName, amount, type, otherSheet) {
  var workbook = new ExcelJS.Workbook();
  workbook.xlsx.readFile(fileName)               
    .then(function() {
      var worksheet = workbook.getWorksheet(sheetName);
      var row = worksheet.getRow(2);
      var outbound = Number(row.getCell(7).value); // G2
      var balance = Number(row.getCell(5).value); // E2
      var total = Number(row.getCell(3).value); // C2
      var inbound = Number(row.getCell(6).value); // F2

      if(!type) {
        worksheet.getCell('E2').value = Number(balance - Number(amount));
        worksheet.getCell('G2').value = Number(outbound + Number(amount));
      } else if(type == 'add') {
        worksheet.getCell('C2').value = Number(total + Number(amount));
        worksheet.getCell('F2').value = Number(inbound + Number(amount));
      } else if(type == 'add1') {
        worksheet.getCell('E2').value = Number(balance + Number(amount));
        worksheet.getCell('F2').value = Number(inbound - Number(amount)); 
      } else if(type == 'revert') {
        worksheet.getCell('C2').value = Number(total - Number(amount));
        worksheet.getCell('G2').value = Number(outbound - Number(amount)); 
      }
      console.log(outbound, balance); 
      return workbook.xlsx.writeFile(fileName);
    })
    .catch(error => {
      console.error('Error = ', error);
    });
}

function addTransaction(fileName, sheetName, data) {
  var workbook = new ExcelJS.Workbook();
  workbook.xlsx.readFile(fileName)              //Change file name here or give file path
    .then(function() {
      var worksheet = workbook.getWorksheet(sheetName);
      var i=1;
      worksheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
        r=worksheet.getRow(i).values;
        r1=r[2];// Indexing a column
        console.log(r1);
        i++;
      });  

      data = data.split(',')
      console.log(data);
      worksheet.addRow([Number(data[0]), data[1].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), Number(data[2]), Number(data[3]), data[4], Number(data[5]), Number(data[6]), data[7], data[8], data[9]]);
      return workbook.xlsx.writeFile(fileName)  //Change file name here or give file path
    })
    .catch(error => {
      console.error('Error = ', error);
    });
}

function editExcel(fileName, sheetName, value, pos) {
  var workbook = new ExcelJS.Workbook();
  if(value == 1) {
    // ravi
    // socket.broadcast.emit('addNew', 'new transaction created');
  }
  workbook.xlsx.readFile(fileName)              //Change file name here or give file path
    .then(function() {
      var worksheet = workbook.getWorksheet(sheetName);
      var i=1;
      worksheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
        r=worksheet.getRow(i).values;
        r1=r[2];// Indexing a column
        console.log(r1);
        i++;
      }); 
      worksheet.getCell(pos).value = Number(value);    //Change the cell number here
      return workbook.xlsx.writeFile(fileName)  //Change file name here or give file path
    })
    .catch(error => {
      console.error('Error = ', error);
    });
}

app.get('*.xlsx',function(req, res) {
  var urlArray = req.url.split('/');
  var xlsFile = urlArray[urlArray.length-1];
  console.log('excel case = ',  req.url, xlsFile);

  fs.exists(xlsFile, function(exists) {
    if (exists) {
      var obj = xlsx.parse(xlsFile);
      // console.log(obj);
    } else {
      res.send('File does not exist');
    }
  });
});

function handleInvalidRequest(url, next) { 
  if(url == '/favicon.ico')
    next()
}

app.get('/', function(req, res) {  
  const authorized = req.cookies["authorization"]; 

  if (authorized) 
    return res.redirect('/dashboard') 
    
  return res.render('index', { page:'login', title:'Sign In', userData: ''});
});

app.get('*', auth, function(req, res, next) {
  const { url } = req;
  const userData = req.cookies["userData"];
  let pageDetails = pagesList[url.replace('/', '')];
  
  if(!pageDetails)
    pageDetails = { page:'error', title:'Under Construction' }
  handleInvalidRequest(url, next);
    
  return res.render('index', { ...pageDetails, userData:JSON.parse(userData)});
});  

io.sockets.on('connection', function(socket){ 
  console.log('a user connected ', socket.id);  

  socket.on('addNew', function(msg) {
    socket.broadcast.emit('addNew', msg); 
  }); 
});

http.listen(3001, () => console.log('Server running on http://localhost:3001/'));

// io.use(function(socket, next) {
//   var handshake = socket.request;

//   console.log(`handshake = ${handshake}`);
//   if (!handshake) 
//     return next(new Error('[[error:not-authorized]]'));
  
//   cookieParser(handshake, {}, function(err) {
//     console.log(`err = ${err}`);
//     if (err) 
//       return next(err); 

//     var sessionID = handshake.signedCookies['userName'];
//     console.log(`sessionID = ${sessionID}`);
//     db.sessionStore.get(sessionID, function(err, sessionData) {
//       if (err) 
//         return next(err); 
//       console.log(`sessionData = ${sessionData}`);

//       next();
//     });
//   }); 
// });

  // io.set('authorization', function(handshake, callback) {
  //   var cookie, token, authPair, parts;

  //   // check for headers
  //   if (handshake.headers.cookie && 
  //       handshake.headers.cookie.split('=')[0]=='myapp') {

  //       // found request cookie, parse it
  //       cookie   = handshake.headers.cookie;
  //       token    = cookie.split(/\s+/).pop() || '';
  //       authPair = new Buffer(token, 'base64').toString();
  //       parts    = authPair.split(/:/);

  //       if (parts.length>=1) {
  //           // assume username & pass provided, check against db
  //           // parts[0] is username, parts[1] is password
  //           // .... {db checks}, then if valid....
  //           callback(null, true);
  //       } else if(parts.length==1) {
  //           // assume only username was provided @ parts[0]
  //           callback(null,true);
  //       } else {
  //           // not what we were expecting
  //           callback(null, false);
  //       }
  //   }
  //   else {
  //       // auth failed
  //       callback(null, false);
  //   }
  // }); 


//for testing, we're just going to send data to the client every second
// setInterval( function() {
//   /*
//     our message we want to send to the client: in this case it's just a random
//     number that we generate on the server
//   */
//   var id = Math.random();
//   io.emit('welcome', {time: Date.now(), id});
//   console.log(`msg = ${id}`);
// }, 5000);