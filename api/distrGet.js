/**
 *   ВЫДАЧА РАСПРЕДЕЛЕНИЯ ПЕДАГОГИЧЕСКОЙ НАГРУЗКИ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает none или объект
// {"pupkin": {"s110": ["8Б", "10Ж"], "d830": ["8Б"]}, "ivanov": ...}
module.exports = async () => {
   let resp = {};
   try {
      let res = await dbFind("distrib", {});
      if (res.length) for (let tObj of res) resp[tObj.tLogin] = tObj.tLoad;
      return JSON.stringify(resp);
   }
   catch(e) {return "none";}
};
