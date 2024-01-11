/**
 *   ПОЛУЧЕНИЕ СПИСКА УЧАЩИХСЯ МЕЖКЛАССНОЙ ГРУППЫ
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Аргумент: grName (имя группы типа 23Б)
// Возвращает сортированный [["Иванов Иван", "10Б", "ivanov"], ...] или "none"
// Заблокированные учащиеся тоже возвращаются в общем списке
// Если в группе никого нет, возвращается пустой массив
module.exports = async grName => {
   let resp = [];  
   try {
      grName = grName.substr(0,  3);
      if (!grName) return "none";

      // Идем циклом по всем ученикам данной группы
      let pupilsArr = await dbFind("pupils", {$where: function() {
         if (this.facult) return (this.facult.includes(grName));
         else return false;
      }});
      if (!pupilsArr.length) return "[]";

      pupilsArr.sort((p1, p2) => p1.Ufamil.localeCompare(p2.Ufamil, "ru"));

      for (let pupil of pupilsArr)
         resp.push(
            [`${pupil.Ufamil} ${pupil.Uname}`, pupil.Uclass, pupil.Ulogin]
         );
      
      return JSON.stringify(resp);

   } catch(e) {return "none";}
};
