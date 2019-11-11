const recipientList = {
  '1' : { id:1, name:'ABC Importers Ltd.', iban:'IBAN123456789', bank: 1001, account: 'RUBY9839839', country: 'Uganda', city: 'Kampala', address: '2, Bandali Rise, Kampala, Uganda'},
  '2' : { id:2, name:'Fasttrack Enterprises Ltd.', iban:'IBAN678123452', bank: 1001, account: 'RUBY1112223', country: 'Kenya', city: 'Nairobi', address: '9, Mogotio Rd, Nairobi, Kenya' },
  '3' : { id:3, name:'Runways for Africa', iban:'IBAN444555666', bank: 1002, account: 'DIAM8899889988', country: 'Zimbabwe', city: 'Harare', address: '347, Samora Machel Ave, Harare, Zimbabwe'},
  '4' : { id:4, name:'PPL Constructions Ltd.', iban:'IBAN222223333', bank: 1002, account: 'DIAM3355774223', country: 'South Africa', city: 'Johannesburg', address: '17, Fortesque Rd, Yeoville, Johannesburg, 2198, South Africa'},
  '5' : { id:5, name:'Smart Logistics Pvt.', iban:'IBAN989898989', bank: 1003, account: 'SAPH00000456', country: 'Ethopia', city: 'Addis Ababa', address:'409, Gabon Street Addis Ababa, 1000, Ethiopia'},
  '6' : { id:6, name:'Baker Group', iban:'IBAN777770000', bank: 1003, account: 'SAPH00000123', country: 'Mozambique', city: 'Maputo', address: '7736, Rua Da Igreja, Maputo, Mozambique'}
}

const statusList = {
  0: {status:'Pending Approval', class:'orange'},
  1: {status:'Awaiting Pattamar Member', class:'grey'},
  2: {status:'Pending Acceptance', class:'orange'},
  3: {status:'Pending Confirmation', class:'blue'},
  4: {status:'Complete', class:'green'},
  5: {status:'Declined', class:'red'}
}
const banksList = {
  1001 : { name:'Ruby Bank', cash:100000, currency:'$', cur: 'USD'}
  , 1002 : { name:'Diamond Bank', cash:25000, currency:'$', cur: 'USD'}
  , 1003 : { name:'Sapphire Bank', cash:8000, currency:'$', cur: 'USD'}
}