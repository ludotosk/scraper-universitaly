const puppeteer = require('puppeteer');
const fs = require('fs');

var corsi = [];

//creare singoli json per aree accademiche
//creare json unico per ricerca generica
//modificare il select id del area accademica clickare cerca prendere i dati

async function ScrapeArea(page) {
    const records = await page.$x('/html/body/div[3]/div/div[2]/div[2]/div[2]/div/table/tbody/tr');
    var u = '';
    var linkUniTxt = '';
    for (i = 1; i < records.length + 1; i++) {
        //azzero a ogni ciclo le variabili
        var h;
        var t;
        var a = 'Sì';
        var c;
        var e = 0;
        var o = 0;
        var inter = 0;
        var s;


        var [el] = await page.$x('/html/body/div[3]/div/div[2]/div[2]/div[2]/div/table/tbody/tr[' + i + ']/td[2]/strong');
        if (el == undefined) {
            [el] = await page.$x('/html/body/div[3]/div/div[2]/div[2]/div[2]/div/table/tbody/tr[' + i + ']/th/h3');
            //console.log('uni');
            const universita = await el.getProperty('textContent');
            u = await universita.jsonValue();
            u = u.replace("     ( Pagina ateneo )", "");
            if (u == 'LUM "Jean Monnet"') {
                u = 'Libera università mediterranea Giuseppe Degennaro'
            }
            if (u == 'Università degli Studi di BOLOGNA') {
                u = 'Alma mater studiorum Università di Bologna'
            }

            [el] = await page.$x('/html/body/div[3]/div/div[2]/div[2]/div[2]/div/table/tbody/tr[' + i + ']/th/a[2]');
            const linkUni = await el.getProperty('href');
            linkUniTxt = await linkUni.jsonValue();
        } else {
            //console.log('corso');
            //console.log(i);
            const titolo = await el.getProperty('textContent');
            var n = await titolo.jsonValue();
            n = n.trim();

            [el] = await page.$x('/html/body/div[3]/div/div[2]/div[2]/div[2]/div/table/tbody/tr[' + i + ']/td[2]/a[3]');
            if (el == undefined) {
                h = linkUniTxt;
            } else {
                const link = await el.getProperty('href');
                h = await link.jsonValue();

            }

            [el] = await page.$x('/html/body/div[3]/div/div[2]/div[2]/div[2]/div/table/tbody/tr[' + i + ']/td[3]/span');
            const classe = await el.getProperty('textContent');
            const classeTxt = await classe.jsonValue();
            if (classeTxt.slice(0, 2) == 'L-' || classeTxt.slice(0, 5) == 'L/SNT') {
                t = 'Triennale';
            } else {
                if (classeTxt == 'LM-4 C.U.' || classeTxt == 'LMR/02' || classeTxt == 'LM-13' || classeTxt == 'LMG/01' || classeTxt == 'LM-41' || classeTxt == 'LM-42' || classeTxt == 'LM-46' || classeTxt == 'LM-85 bis') {
                    t = 'Magistrale a Ciclo Unico';
                } else {
                    t = 'Magistrale';
                }

            }
            c = classeTxt;

            [el] = await page.$x('/html/body/div[3]/div/div[2]/div[2]/div[2]/div/table/tbody/tr[' + i + ']/td[10]/img');
            if (el != undefined) {
                const inglese = await el.getProperty('alt');
                const ingTxt = await inglese.jsonValue();
                if (ingTxt == "Corso in lingua inglese") {
                    e = 1;
                }
            }

            [el] = await page.$x('/html/body/div[3]/div/div[2]/div[2]/div[2]/div/table/tbody/tr[' + i + ']/td[7]/img');
            if (el != undefined) {
                const teledidattica = await el.getProperty('alt');
                const teleTxt = await teledidattica.jsonValue();
                if (teleTxt == "teledidattica") {
                    o = 1;
                }
            }

            [el] = await page.$x('/html/body/div[3]/div/div[2]/div[2]/div[2]/div/table/tbody/tr[' + i + ']/td[6]/img');
            const accesso = await el.getProperty('title');
            const accessoTxt = await accesso.jsonValue();
            if (accessoTxt == 'Libero') {
                a = 'No';
            } else {
                a = 'Sì'
            }

            [el] = await page.$x('/html/body/div[3]/div/div[2]/div[2]/div[2]/div/table/tbody/tr[' + i + ']/td[2]');
            const citta = await el.getProperty('innerText');
            s = await citta.jsonValue();
            var indexInzio = s.lastIndexOf(' , ');
            var indexFine = s.indexOf('\n');
            s = s.substring(indexInzio, indexFine);
            s = s.slice(3, s.length);

            [el] = await page.$x('/html/body/div[3]/div/div[2]/div[2]/div[2]/div/table/tbody/tr[' + i + ']/td[9]/img');
            if (el != undefined) {
                const internazionale = await el.getProperty('title');
                const intTxt = await internazionale.jsonValue();
                //console.log(intTxt);
                if (intTxt == "Corso a rilascio titolo doppio o congiunto") {
                    inter = 1;
                }
            }

            if (n != '') {
                corsi.push({ n, h, t, u, a, c, e, s, o, inter });
            }
        }
    }
    await page.evaluate(() => {
        var tabella = document.querySelector('#risultati > div.skin > div > table');
        tabella.remove();
    });
}

async function laucnhScrape() {
    const inizio = Date.now();

    console.log('Start');

    const browser = await puppeteer.launch({ headless: true, });
    const page = await browser.newPage();

    console.log('Browser aperto');

    await page.setRequestInterception(true);

    //if the page makes a  request to a resource type of image or stylesheet then abort that request
    page.on('request', request => {
        if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() == 'font' || request.resourceType() == 'media')
            request.abort();
        else
            request.continue();
    });

    await page.goto('https://www.universitaly.it/index.php/cercacorsi/universita');

    console.log('Pagina aperta');

    //primo valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '01';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inizio prima lista')
    await ScrapeArea(page);
    console.log('fine prima lista');

    //secondo valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '02';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inzio seconda lista')
    await ScrapeArea(page);
    console.log('fine seconda lista');

    //terzo valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '03';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inizio terza lista')
    await ScrapeArea(page);
    console.log('fine terza lista');

    //quarto valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '04';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inzio quarta lista')
    await ScrapeArea(page);
    console.log('fine quarta lista');

    //quinto valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '05';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inizio quinta lista')
    await ScrapeArea(page);
    console.log('fine quinta lista');

    //sesto valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '06';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inzio sesta lista')
    await ScrapeArea(page);
    console.log('fine sesta lista');

    //settimo valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '07';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inizio settima lista')
    await ScrapeArea(page);
    console.log('fine settima lista');

    //ottavo valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '08';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inzio ottava lista')
    await ScrapeArea(page);
    console.log('fine ottava lista');

    //nono valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '09';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inizio nona lista')
    await ScrapeArea(page);
    console.log('fine nona lista');

    //decimo valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '10';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inzio decima lista')
    await ScrapeArea(page);
    console.log('fine decima lista');

    //unidicesimo valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '11';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inizio undicesima lista')
    await ScrapeArea(page);
    console.log('fine undicesima lista');

    //dodicesimo valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '12';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inizio dodicesima lista')
    await ScrapeArea(page);
    console.log('fine dodicesima lista');

    //tredicesimo valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '13';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inizio tredicesima lista')
    await ScrapeArea(page);
    console.log('fine tredicesima lista');

    //quattordicesimo valore
    await page.evaluate(() => {
        document.querySelector('#areacun').value = '14';
    });

    await page.click('#avvia_ricerca');
    await page.waitForSelector('#risultati > div.skin > div > table > tbody > tr:nth-child(1)');

    console.log('inizio quattordicesima lista')
    await ScrapeArea(page);
    console.log('fine quattordicesima lista');

    page.close();
    browser.close();

    console.log('numero corsi pre pulizia');
    console.log(corsi.length);

    corsi.sort(function(a, b) {
        if (a.n.toLowerCase() < b.n.toLowerCase()) return -1;
        if (a.n.toLowerCase() > b.n.toLowerCase()) return 1;
        return 0;
    });

    for (let x = 0; x < corsi.length; x++) {
        for (var z = 0; z < corsi.length; z++) {
            if (x != z) {
                if (corsi[x].n.toLowerCase() == corsi[z].n.toLowerCase() && corsi[x].u.toLowerCase() == corsi[z].u.toLowerCase() && corsi[x].t.toLowerCase() == corsi[z].t.toLowerCase()) {
                    corsi.splice(z, 1);
                }
            }
        }
    }

    /*    var lista = JSON.parse(JSON.stringify(corsi));
   
       for (let x = 0; x < lista.length; x++) {
           delete lista[x].h;
           delete lista[x].c;
           delete lista[x].e;
       }
   
       fs.writeFile('./src/corsi.json', JSON.stringify(lista), function (err) {
           if (err) return console.log(err);
           console.log('lista > corsi.json');
       });
   
       var nocitta = JSON.parse(JSON.stringify(corsi));
   
       for (let x = 0; x < nocitta.length; x++) {
           delete nocitta[x].s;
       }
   
       fs.writeFile('./src/corsi.json', JSON.stringify(nocitta), function (err) {
           if (err) return console.log(err);
           console.log('corsi > corsi.json');
       }); */

    console.log('numero corsi post pulizia');
    console.log(corsi.length);

    fs.writeFile('corsi.json', JSON.stringify(corsi), function(err) {
        if (err) return console.log(err);
        console.log('corsi > corsi.json');
        const fine = (Date.now() - inizio) / 1000;
        console.log('tempo in secondi', fine);
        process.exit();
    });
}

laucnhScrape();