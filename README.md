# Scaper for [universitaly](https://www.universitaly.it/) 
## What this script does?
This script has wrotten to download all the data about all degree courses in Italy from universitaly.
## Which data collect this script?
See the data repo (coming soon).
## How it works?
It uses puppeteer to open all the pages that contain the data and read all the tables of each page. If you set headeless mode off you can see what puppeteer is doing.
## Why is so slow?
Because I run this script one time per year and I don't need to waste my time to rebuilt every tool that I buil every time that I improve my skill.
## Why there are three js file?
The scrper-cdl.js is the file that download the degree courses data, the scaper-master download the data of what in Italy we call "master" that as not the same meaning of the english word master and crea-db.js is a little script that I use to merge master data with degree data. Since I had done scraper-master after scaper-cdl the first one is the more optimazed.