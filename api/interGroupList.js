/**
 *   ПОЛУЧЕНИЕ СПИСКА МЕЖКЛАССНЫХ ГРУПП, ИМЕЮЩИХСЯ В КОЛЛЕКЦИИ CURRIC
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает несортированный массив групп типа
// [
//    ["29Б", "Доп. главы математики", "ivanov"],
//    ...
// ]
module.exports = async () => {
   try {
      let grList = [];
      let res = await dbFind("curric", {type: "intergroup"});      
      for (let doc of res)
         grList.push([doc.ingrName, doc.ingrTitle, doc.ingrTeach]);
      return JSON.stringify(grList);
   }
   catch(e) {return "[]";}
};
