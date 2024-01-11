/**
 *   ПОЛУЧЕНИЕ ДАННЫХ ОБ УВАЖИТЕЛЬНЫХ ПРИЧИНАХ ПРОПУСКОВ УРОКОВ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В запросе приходят ["8Б", "ivanov", "petrov"]
//      8Б - это запрашиваемый класс (пустой, если нужен один ученик)
//  ivanov - это запрашиваемый ученик (пустой, если запрашивается класс)
//  petrov - это логин автора запроса (подписывается скриптом index.js)
// 
// При вызове с фронтенда передается массив, состоящий только из двух
// первых аргументов (один из них всегда пустой)
// 
// Возвращается объект с датами начала и окончания действия каждой справки
// {
//    ivanov: [["2019-09-02", "2019-09-13"], ...],
//    petrov: ...
// }
module.exports = async (args) => {
   let resp = {}, bdReq = {};
   try {
      if (args.length != 3) return "none";
      let clName = args[0].substr(0, 20).trim(),
          pupil  = args[1].substr(0, 20).trim(),
          lg     = args[2].substr(0, 20).trim();

      if ((!clName && !pupil) || !lg) return "none";
      
      // Проверяем полномочия автора запроса
      // (либо ученик запрашивает сам себя, либо это сотрудник)
      if (pupil != lg) { 
         let res = await dbFind("staff", {Ulogin: lg});
         if (!res.length) return "none";
      }      
      
      if (pupil) bdReq = {pupil: pupil};    // Если запрашивается один ученик      
      else       bdReq = {Uclass: clName};  // Если запрашивается класс      
      let sprResp = await dbFind("spravki", bdReq);
      for (let spravka of sprResp) {
         let start = spravka.start, fin = spravka.fin, pupil = spravka.pupil;
         if (!resp[pupil]) resp[pupil] = [];
         resp[pupil].push([start, fin]);
      }
      
      return JSON.stringify(resp);
   }
   catch(e) {return "none";}
};
