/**
 *   РЕДАКТИРОВАНИЕ ТЕМ УРОКОВ, ДОМАШНИХ ЗАДАНИЙ И ВЕСОВ ОТМЕТОК
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В запросе приходят [класс, предмет, дата, тема, дз, вес, к-во часов, учитель]
// (логин учителя из фронтенда в массиве аргументов не передается,
// подписывается модулем API index.js)
// NB! Вес и часы приходят как строки, но в базу пишутся как числа!
// Дата приходит в формате "d607", где 6 - номер месяца
// (сентябрь = 0, май = 8), 07 - число месяца
// Пример: ["8Ж-дев", "s110", "d113", "Тема", "ДЗ", "4", "ivanov"]
// Возвращает success или none
// Данные хранятся в коллекции topics (одна запись - один урок):
// {
//    "g": "8Ж-дев", "s": "s110",   "l": "ivanov",
//    "d": "d113",   "t": "Африка", "h": "Глава 4", "w": 4, "v": 2
// }
module.exports = async argsObj => {
   try {
      if (argsObj.length != 8) return "none";
      let gr = argsObj[0].substr(0,  20).trim(),
          sb = argsObj[1].substr(0,   4).trim(),          
          dt = argsObj[2].substr(0,   4).trim(),
          tp = argsObj[3].substr(0, 500).trim(),
          ht = argsObj[4].substr(0, 500).trim(),
          wt = argsObj[5].substr(0,   1).trim(),
          vl = argsObj[6].substr(0,   1).trim(),
          lg = argsObj[7].substr(0,  20).trim();

      if (!gr || !sb || !lg || !dt || !wt || !vl) return "none";
      if (!/^[0-9]{1}$/.test(wt))          return "none"; wt = Number(wt);
      if (!/^[1-7]{1}$/.test(vl))          return "none"; vl = Number(vl);
      if (!/^d[0-9][0-3][0-9]$/.test(dt))  return "none";
      if (Number(dt.substr(2, 2)) > 31)    return "none";
      
      // Вырезаем html-теги, сохраняя ссылки в домашнем задании
      tp = tp.replace(/<[^>]+?>/gi, '');
      ht = ht.replace(/<.+?javascript:.+?>/gi, '').replace(/<\/a>/g, '¤')
         . replace(/<(?!a )[^>]+?>/g, ' ').replace(/¤/g, "</a>")
         . replace(/\s+/g, ' ').replace(/(&nbsp;)+/g, ' ').trim();

      // Проверяем полномочия учителя на запрашиваемую группу
      // для внеурочной деятельности (межклассные сводные группы)
      if (sb == "s000") {
         let distrRes = await dbFind("curric", {
            type: "intergroup", ingrName: gr, ingrTeach: lg
         });
         if (!distrRes.length) return "none";
      }
      
      // Проверяем полномочия учителя на запрашиваемые класс и предмет
      // для традиционных уроков
      else {
         let distrRes = await dbFind("distrib", {tLogin: lg});
         if (!distrRes.length) return "none";
         else {
            let distr = distrRes[0].tLoad;
            if (!distr[sb]) return "none";
            else if (!distr[sb].includes(gr)) return "none";
         }
      }
      
      // Количество часов пишем в базу только в случае, если оно не равно 1
      let objFind = {g: gr, s: sb, l: lg, d: dt},
          objNew  = {...objFind, t:tp, h:ht, w:wt};
      if (vl != 1) objNew.v = vl;
      
      // Проверяем, нет ли уже такого урока      
      let lessons = await dbFind("topics", objFind);
      
      // Если есть - либо редактируем, либо удаляем (если tp='')
      if (lessons.length) {
         if (!tp) db["topics"].remove(objFind, {});
         else db["topics"].update(objFind, objNew, {});
      }      
      
      // Если нет - добавляем
      else if (tp) db["topics"].insert(objNew);
      
      return "success";
   }
   catch(e) {return "none";}
};
