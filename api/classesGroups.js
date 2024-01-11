/**
 *   ПОЛУЧЕНИЕ СПИСКА КЛАССОВ И ИХ ПОДГРУПП ИЗ КОЛЛЕКЦИИ CURRIC
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает несортированный массив имен классов и их подгрупп
module.exports = async () => {
   try {
      let clList = [];
      let res = await dbFind("curric", {type: "class"});      
      for (let currDoc of res) {
         clList.push(currDoc.className);
         clList.push(...currDoc.groups);
      }      
      return JSON.stringify(clList);
   }
   catch(e) {return "[]";}
};
