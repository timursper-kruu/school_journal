/**
 *   ВЫДАЧА СПИСКА АДМИНИСТРАТОРОВ ЭЖ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает none или массив найденных администраторов,
// где каждый администратор - это объект (стандартный для коллекции staff)
module.exports = async () => {
   try {
      let res = await dbFind("staff", {admin: true});
      return JSON.stringify(res);
   }
   catch(e) {return "none";}
};
