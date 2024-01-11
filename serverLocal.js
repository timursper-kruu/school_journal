/**
 *   СЕРВЕР ЭЛЕКТРОННОГО ЖУРНАЛА «ШКАЛА»: ЛОКАЛЬНАЯ РАБОТА
 *   Локальная работа производится по протоколу http; логи не пишутся
 *   Copyright © 2021, А.М.Гольдин. Modified BSD License
 */
"use strict";

/* ПОДКЛЮЧЕНИЕ МОДУЛЕЙ И ОПРЕДЕЛЕНИЕ ГЛОБАЛЬНЫХ КОНСТАНТ
 * ----------------------------------------------------------------------- */
const DOCROOT   = __dirname + "/www/",
      http      = require("http"),
      fs        = require("fs"),
      nedb      = require("@yetzt/nedb"),
      {
         PORT, SERVER, ERR404, MIME, PWD, SALT, SALTPIN,
         ADMIN, KEYPATH, CERTPATH, CAPATH
      }         = require("./config"),
      api       = require("./api"),
      captGen   = require("./api/captchaGen"),
      PORTLOCAL = 8080;

global.salt    = SALT;
global.saltpin = SALTPIN;
global.admPwd  = PWD;


/* ИНИЦИАЛИЗАЦИЯ КОЛЛЕКЦИЙ БАЗЫ ДАННЫХ
 * ----------------------------------------------------------------------- */
const dbTables = [
   "staff", "pupils", "curric", "distrib", "grades", "spravki", "topics",
   "authlog", "notes"
];
global.db  = {};
for (let dbN of dbTables) db[dbN] =
   new nedb({filename: `${__dirname}/db/${dbN}.db`, autoload: true});


/* ОПРЕДЕЛЕНИЯ ФУНКЦИЙ
 * ----------------------------------------------------------------------- */

// Генерирование числового значения капчи по её Id
// (используется также для генерирования родительских паролей из детских)
global.captNumGen = str => {
   let captNum = '', s, h = 0;
   for (let j = 0; j < 6; j++) {
      s = global.salt + j + str;
      for (let i=0; i<s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
      captNum += Math.abs(h) % 10;
   }
   return captNum;
}

// Промисификатор метода find() работы с базой db
// Пример вызова: let res = await dbFind("curric", {type: "class"}) 
global.dbFind = (collectionName, objFind) => {
   return new Promise((resolve, reject) => {
      db[collectionName].find(objFind, (err, docs) => {
         if (err) reject(err);
         else     resolve(docs);
      })
   })
};

// Изготавление хэша длины 24 из строки str с солью slt
global.hash = (str, slt) => {   
   let
      alph = "0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz",
      char,
      strNew,
      h = 0,
      pass = '';
   for (let j = 0; j < 24; j++) {
      strNew = slt + j + str;
      for (let i = 0; i < strNew.length; i++) {
         char = strNew.charCodeAt(i);
         h = ((h << 5) - h) + char;
      }
      pass += alph[Math.abs(h) % alph.length];
   }
   return pass;
}

// Отправка ответа (kod - код состояния, contType - mime-тип, content - тело)
const sendOtvet = (otvet, kod, contType, content) => {
   otvet.writeHead(kod, {
      "Content-Type": contType, "Server": SERVER,
      "Strict-Transport-Security": "max-age=32000000"
   });
   otvet.end(content);
}

/* ОБЪЕКТЫ, ОБСЛУЖИВАЮЩИЕ РАБОТУ С КАПЧЕЙ
 * ----------------------------------------------------------------------- */

// Параметры отдаваемой капчи
const captOpt = {
   bkR: 246, bkG: 243, bkB: 240, // фоновый цвет
   fnR: 214, fnG: 191, fnB: 168, // цвет шрифта   
}

// Массив выданных сервером клиенту ID капчи и время жизни капчи в секундах
// (те, что вернулись от клиента, а также старые удаляются)
global.captchaIdArr = [];
const CAPTDEATH = 180;


/* СОБСТВЕННО ЦИКЛ ОБРАБОТКИ ЗАПРОСА
 * ----------------------------------------------------------------------- */
http.createServer((zapros, otvet) => {
   
   // Получаем параметры запроса
   let url      = new URL("http://host" + zapros.url),
       pathname = url.pathname;
   if (!pathname.includes(".")) pathname += "/index.html";
   pathname = pathname.replace("//", '/').replace(/\.\./g, '');

   let ADDR = (zapros.socket.remoteAddress || "unknown")
            . replace("::1", "127.0.0.1").replace(/\:.*\:/, '');
   
   // Если пришел запрос контактов администратора
   if (pathname == "/a.a") sendOtvet(otvet, 200, "text/plain", ADMIN);
   
   // Если пришел запрос капчи, отдаем ее вместе с ее Id (в заголовке X-Cpt)
   else if (pathname == "/cpt.a") {
      let tm = Date.now();
      // Удаляем все устаревшие Id капчи и кладем новый Id
      captchaIdArr = captchaIdArr.filter(
         x => Number(x) > Number(tm - CAPTDEATH * 1000));
      captchaIdArr.push(tm);
      otvet.writeHead(200,
         {"Content-Type": "image/png", "Server": SERVER, "X-Cpt": tm});
      otvet.end(captGen(captNumGen(tm), captOpt));
   }
   
   // Если метод GET, просто отдаем запрошенный статический файл
   else if (zapros.method == "GET")
      fs.readFile(DOCROOT + pathname, function(err, cont) {
         let mtip = MIME[pathname.split(".")[1]];      
         if (!mtip || err) {
            sendOtvet(otvet, 404, "text/html", ERR404);
         }
         else sendOtvet(otvet, 200, mtip, cont);
      });
   
   // Если метод POST - это запрос к API
   else {
      let postData = '';
      zapros.on("data", dann => postData += dann.toString());
      zapros.on("end",  async () => {
         let cont = await api(postData, ADDR);
         sendOtvet(otvet, 200, "text/plain", cont);             
      });      
   }
   
}).listen(PORTLOCAL);

let now = (new Date()).toString().replace(/ \(.*\)/, '');
console.info(`${now} ScoleServerLocal стартовал на порту ${PORTLOCAL}`);
