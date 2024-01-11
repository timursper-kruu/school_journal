/**
 *   ГЕНЕРИРОВАНИЕ ВЕДОМОСТИ ИТОГОВЫХ ОТМЕТОК ОДНОГО КЛАССА
 *   Copyright © 2022, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В аргументах приходит массив типа ["8Б", "petrov"],
// где petrov - логин юзера, который запрашивает табель
// (логин юзера с фронтенда не передается, подписывается скриптом index.js).
// Возвращает none или csv-файл с ведомостью итоговых отметок данного класса

// Импортируем из ini.js сортировку списка
// предметов sbSort(), объект учебных периодов dtsIt и список предметов по
// умолчанию sbDef, список дополнительных предметов SB(),
// функцию для получения списка класса PL()
const INI = require("../www/js/ini"),
      SB  = require("./subjList"),
      PL  = require("./pupilsList");

module.exports = async (argArr) => {
   let resp = ";;", otmetki = {};
   try {
      // Запрашиваемый класс и логин запрашивающего юзера
      if (argArr.length != 2) return "none";
      let clas = argArr[0].substr(0, 5).trim(),
          user  = argArr[1].substr(0, 20).trim();
      if (!/^\d{1,2}[А-Я]{1}$/.test(clas) || !/^[a-z0-9]+$/.test(user))
         return "none";
      
      // Администратор ли он?
      let admRes = await dbFind("staff", {Ulogin: user});
      if (!admRes.length) admRes = [{}];
      
      // Проверяем полномочия юзера на запрос отметок этого класса
      if (!admRes[0].admin) {
         
         // Проверяем полномочия кл. руководителя на запрашиваемый класс
         let clRes = await dbFind("curric", {type: "class", className: clas});
         if (!clRes.length)          return "none";
         if (clRes[0].tutor != user) return "none";
      }

      // Получаем объект со списком класса {kozlov: "Козлов Вася", ...}
      let PUPS = {};
      const pupList = JSON.parse(await PL([clas]));
      for (let p of pupList) PUPS[p[1]] = p[0];
      
      // Получаем итоговые отметки и подписываем их в объект otmetki
      // (внеурочная деятельность не учитывается)
      let res = await dbFind(
         "grades", {c: RegExp('^' + clas + ".*"), d: RegExp("\\w{5}")}
      );
      for (let otm of res) if (otm.g) {
         let subj = otm.s, pupil, period = otm.d;
         if (!PUPS[otm.p]) continue;
         pupil = PUPS[otm.p];
         if (!otmetki[pupil]) otmetki[pupil] = {};
         if (!otmetki[pupil][period]) otmetki[pupil][period] = {};
         otmetki[pupil][period][subj] =
            otm.g.replace(/^999$/g, "зач").replace(/^0$/g, "н/а");
      }

      // Упорядоченный список учебных периодов с их краткими наименованиями
      // [["d205a", "1ч" ], ["d331b", "2ч"], ...]
      let PERS = Object.keys(INI.dtsIt).sort().map(x => [x, INI.dtsIt[x][0]]);

      // Объект с кодами (ключи) и краткими названиями учебных предметов
      let SBFULL = {};
      for (let x of [
         ...Object.entries(INI.sbDef),
         ...Object.entries(JSON.parse(await SB()))
      ]) SBFULL[x[0]] = x[1];

      for (let [k, sb] of Object.entries(SBFULL))
         SBFULL[k] = sb.replace(/[().\-]/g, '').split(' ')
                   . map(x => x.substr(0,4)).join('_')
                   . replace(/(А||а)нал/g, "$1на");

      // Список кодов учебных предметов, встречающихся в этом классе
      let sbjSet = new Set();
      for (let pupil in otmetki)
         for (let period in otmetki[pupil])
            for (let subj in otmetki[pupil][period]) {
               sbjSet = sbjSet.add(subj);
            }
      let SBJS = [...sbjSet].sort();

      // Формируем csv-файл
      for (let k of SBJS) resp += `${SBFULL[k]};`;
      resp += '\n';
      let spisok = Object.entries(PUPS).map(x => x[1])
                 . sort((a, b) => a.localeCompare(b, "ru"));
      for (let pupil of spisok) {
         let needFIO = true;
         if (!otmetki[pupil]) otmetki[pupil] = {};
         for (let period of PERS) {
            resp += `${needFIO ? pupil : ''};${period[1]};`;
            for (let subj of SBJS) {               
               if (!otmetki[pupil][period[0]])
                  otmetki[pupil][period[0]] = {};
               let otm = otmetki[pupil][period[0]][subj] ?
                         otmetki[pupil][period[0]][subj] : '';
               resp += otm + ';';
            }
            resp += "\n";
            needFIO = false;
         }
      }

      return resp;
   }
   catch(e) {return "none";}
};
