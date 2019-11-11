module.exports = function(req, res, next) { 
  const token = req.cookies["authorization"]; 

  // console.log('req.cookies = ', req.cookies, {token});
  if (!token) 
    res.redirect('/')
  else 
    next()
};