/**
 *   СЕРВЕР ЭЛЕКТРОННОГО ЖУРНАЛА «ШКАЛА»
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

/* ПОДКЛЮЧЕНИЕ МОДУЛЕЙ И ОПРЕДЕЛЕНИЕ ГЛОБАЛЬНЫХ КОНСТАНТ
 * ----------------------------------------------------------------------- */
const DOCROOT  = __dirname + "/www",

      https    = require("https"),
      fs       = require("fs"),
      nedb     = require("@yetzt/nedb"),

      {
         PORT, SERVER, ERR404, MIME, PWD, SALT, SALTPIN,
         ADMIN, KEYPATH, CERTPATH, CAPATH
      }        = require("./config"),
      api      = require("./api"),
      captGen  = require("./api/captchaGen"),

      httpsOpt = {
         key:  fs.readFileSync(__dirname + "/ssl/" + KEYPATH),
         cert: fs.readFileSync(__dirname + "/ssl/" + CERTPATH)      
      };
      if (CAPATH) httpsOpt.ca = CAPATH;

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

// Запись серверного лога
const putlog = (ip, reqMeth, pathname, kodOtv, lengthOtv) => {
   let
      now = new Date(),
      y   = now.getFullYear(),
      m   = (now.getMonth() + 1).toString().padStart(2, '0'),
      d   = now.getDate().toString().padStart(2, '0'),
      h   = now.getHours().toString().padStart(2, '0'),
      i   = now.getMinutes().toString().padStart(2, '0'),
      s   = now. getSeconds().toString().padStart(2, '0'),
      dt  = `${y}-${m}-${d}`,
      tm  = `${h}:${i}:${s}`;
   
   // Пишем данные в серверный лог
   fs.appendFile(
      __dirname + `/logs/${dt}.log`,
      `${ip} [${tm}] ${reqMeth} ${pathname} ${kodOtv} ${lengthOtv}\n`,
      e => {}
   )
   
   // Пишем успешный запрос авторизации в коллекцию authlog
   if (pathname.includes(" login]") && lengthOtv > 5) {
      let loginArr = pathname.replace(/[\[\], ]/g, '').replace("login", '')
                   . split('_'),
          login = loginArr[0],
          categ = loginArr[1] || "root";
      db.authlog.insert({d: `${dt} ${tm}`, l: login, c: categ, ip: ip});
   }
};

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
      "Strict-Transport-Security": "max-age=32000000",
      "Access-Control-Allow-Origin": "*"
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
https.createServer(httpsOpt, (zapros, otvet) => {
   
   // Получаем параметры запроса
      let url  = new URL("http://host" + zapros.url),
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
      otvet.writeHead(200, {
         "Content-Type": "image/png", "Server": SERVER, "X-Cpt": tm,
         "Access-Control-Allow-Origin": "*",
         "Access-Control-Expose-Headers": "X-Cpt"
      });
      otvet.end(captGen(captNumGen(tm), captOpt));
   }
   
   // Если метод GET, просто отдаем запрошенный статический файл
   else if (zapros.method == "GET")
      fs.readFile(DOCROOT + pathname, function(err, cont) {
         let mtip = MIME[pathname.split(".").pop()];    
         if (!mtip || err) {
            sendOtvet(otvet, 404, "text/html", ERR404);
            putlog(ADDR, "GET", pathname, 404, ERR404.length);
         }
         else {
            sendOtvet(otvet, 200, mtip, cont);
            // Из успешных GET-запросов логируем только запрос главной
            if (pathname == "/index.html")
               putlog(ADDR, "GET", '/', 200, cont.length);
         }
      });
   
   // Если метод POST - это запрос к API
   else {
      let postData = '';
      zapros.on("data", dann => postData += dann.toString());
      zapros.on("end",  async () => {
         let cont = await api(postData, ADDR);
         sendOtvet(otvet, 200, "text/plain", cont);

         // Определяем логин и запрашиваемую функцию API;
         // пишем логин и запрашиваемую функцию в серверный лог
         // (если функция содержится в списке логируемых функций),
         // а успешный запрос авторизации - еще и в базу (authlog)
         // с помощью функции putlog (определена выше)
         let logCont  = '';
         let logFuncs = [
            "login", "classAdd", "classDel", "subjAdd", "subjEdit", "subjDel",
            "usAddEdit", "usImport", "usSetAdmin", "usBlock", "usChPwd",
            "tutorSet", "distrEdit", "topicEdit", "gradeAdd", "subgrEdit",
            "subgrPups", "sprAdd", "sprDel", "notesAdd", "notesDel",
            "interGroupEdit", "interGroupDel", "interGroupPup", "tabelGenAll"
         ];
         try {
            let postDataObj = JSON.parse(postData);
            let logLogin    = postDataObj.l || "none";
            let logFunc     = postDataObj.f || "none";
            let logRole     = `_${postDataObj.t}` || "_none";
            if (logLogin == "admin") logRole = '';
            if (logFuncs.includes(logFunc))
               logCont = `[${logLogin}${logRole} ${logFunc}]`;
         }
         catch(e) {;}
         let codeOtv = (cont == "none") ? 403 : 200;
         if (logCont) putlog(ADDR, "POST", logCont, codeOtv, cont.length);         
      });      
   }
   
}).listen(PORT);

// Перенаправление с http на https
const http = require("http");
http.createServer((zapros, otvet) => {
   try {
      otvet.writeHead(
         301, {"Location": "https://" + zapros.headers["host"] + zapros.url}
      ); otvet.end();
   }
   catch (e) {
      otvet.writeHead(404, {"Content-Type": "text/html", "Server": SERVER});
      otvet.end(ERR404);
   }
}).listen(80);

let now = (new Date()).toString().replace(/ \(.*\)/, '');
console.info(`${now} ScoleServer стартовал на порту ${PORT}`);
