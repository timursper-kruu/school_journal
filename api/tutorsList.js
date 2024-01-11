/**
 *   ПОЛУЧЕНИЕ СПИСКА КЛАССНЫХ РУКОВОДИТЕЛЕЙ ИЗ КОЛЛЕКЦИИ CURRIC
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает объект {"8А": "pupkin", "8Б": "prujinkin", ...}
module.exports = async () => {
   try {
      let res = await dbFind("curric", {type: "class"});
      let tutList = {};
      for (let currDoc of res) {
         let tutLogin = currDoc.tutor || "none";
         tutList[currDoc.className] = tutLogin;
      }
      return JSON.stringify(tutList);
   }
   catch(e) {return "{}";}
};
