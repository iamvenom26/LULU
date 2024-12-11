const express= require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/user');
const reportRoutes = require('./routes/report');
const { checkForAthenticationCookie } = require('./middleware/authetication');
const fs = require('fs');

// Create upload directories if they don't exist
const uploadDir = path.join(__dirname, 'public', 'uploads');
const profilesDir = path.join(uploadDir, 'profiles');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
}

const app = express();
const PORT = 186;


// MongoDB
mongoose
  .connect('mongodb://localhost:27017/plulu')
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Connection Error:', err));


  // Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(checkForAthenticationCookie('token'));

app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));


app.use('/user', userRoutes); 
app.use('/report', reportRoutes);  
app.get('/',async(req, res) => {
  res.render('main', {
      user: req.user,
  });
});


app.get('/aboutUs',(req,res)=>{
  res.render('about');
})


app.get('/logo',(req,res)=>{
  res.render('index');
})



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/logo`);
  });