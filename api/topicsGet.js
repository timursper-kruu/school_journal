/**
 *   ПОЛУЧЕНИЕ ТЕМ УРОКОВ, ДОМАШНИХ ЗАДАНИЙ И ВЕСОВ ОТМЕТОК ОДНОЙ СТРАНИЦЫ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В запросе приходят [класс, предмет, учитель]
// Возвращается none либо объект (вес и часы - не строки, а числа!):
// {
//   d601: {
//      t: "Африка",
//      h: "Учить главу 4",
//      w: 4,
//      v: 2                  // если равно 1, то этого свойства нет
//   },
//   ...
// }
module.exports = async argsObj => {   
   try {
      let gr = argsObj[0].substr(0, 20).trim(),
          sb = argsObj[1].substr(0,  4).trim(),
          lg = argsObj[2].substr(0, 20).trim();

      if (!gr || !sb || !lg) return "none";
      
      let topics = {};      
      let res = await dbFind("topics", {g: gr, s: sb, l: lg});      
      for (let currTopic of res) {
         topics[currTopic.d] = {t:currTopic.t, h:currTopic.h, w:currTopic.w};
         if (currTopic.v) (topics[currTopic.d]).v = currTopic.v;
      }
      
      return JSON.stringify(topics);
   }
   catch(e) {return "none";}
};
