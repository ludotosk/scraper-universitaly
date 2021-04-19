const fs = require('fs');

var cdl = fs.readFileSync('corsi.json');
var master = fs.readFileSync('master.json');

var db = '{"corsi":' + cdl + ',"master":' + master + '}'

fs.writeFile('db.json', db, function(err){
    if (err) throw err;
    console.log('db creato!');
})