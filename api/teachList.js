/**
 *   ПОЛУЧЕНИЕ СПИСКА ВСЕХ УЧИТЕЛЕЙ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает массив учителей, где каждый учитель - это объект
// {login: "vasya", fio: "Пупкин В. И."}
module.exports = async req => {
   let res = [];
   try {
      let dbResult = await dbFind("staff", {});
      
      if (dbResult.length) {
         for (let currUser of dbResult) {
            if (currUser.block) continue;
            let fio = `${currUser.Ufamil} ${currUser.Uname.substr(0, 1)}. `
                   + `${currUser.Uotch.substr(0, 1)}.`;
            res.push({login: currUser.Ulogin, fio: fio});
         }
         return JSON.stringify(res);
      }
      else return "none";
   }
   catch(e) {return "none";}
};
