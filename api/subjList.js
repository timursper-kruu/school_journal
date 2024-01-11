/**
 *   ПОЛУЧЕНИЕ СПИСКА ДОПОЛНИТЕЛЬНЫХ ПРЕДМЕТОВ
 *   И КУРСОВ ВНЕУРОЧНОЙ ДЕЯТЕЛЬНОСТИ ИЗ КОЛЛЕКЦИИ CURRIC
 *   Copyright © 2021, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает объект с условными номерами (ключи) и наименованиями предметов;
// для предметов внеурочной деятельности ключом является имя группы типа "23Б"
module.exports = async () => {
   try {
      let sbList = {};

      let res = await dbFind("curric", {type: "subj"});      
      for (let currDoc of res) sbList[currDoc.sbKod] = currDoc.sbName;
      
      res = await dbFind("curric", {type: "intergroup"});
      for (let currGr of res) sbList[currGr.ingrName] = currGr.ingrTitle;
      
      return JSON.stringify(sbList);
   }
   catch(e) {return "{}";}
};
