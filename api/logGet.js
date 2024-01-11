/**
 *   ПОЛУЧЕНИЕ ВЫПИСКИ ИЗ ЛОГА АВТОРИЗАЦИИ ПОЛЬЗОВАТЕЛЕЙ
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В запросе приходят [1, "09", "23", "ivanov", "petrov"]
//    1  - это запрашиваемый тип лога (0 - дети или сотрудники, 1 - все)
//    09 - это запрашиваемый месяц
//    23 - это запрашиваемый час (важен только для лога за один час)
//    ivanov - это данные фильтра (для детей или
//             сотрудников - логин, для лога за один час - дата)
//    petrov - это логин автора запроса (подписывается скриптом index.js)
// 
// Возвращается сериализованная в строку выписка из лога - массив объектов
// {d:"2020-01-19 17:14:02", l:"ivanov", c:"par", ip:"1.2.3.4", _id: "Gf56d"}

module.exports = async (args) => {
   let request = {};
   try {
      if (args.length != 5) return "none";
      let tip  = args[0],
          mon  = args[1].substr(0, 2),
          hour = args[2].substr(0, 2),
          name = args[3].substr(0, 20).trim(),
          lg   = args[4].substr(0, 20).trim();

      if (!name || !lg) return "none";
      if (!/^\d{1}$/.test(tip.toString())) return "none";     
      
      // Сотрудник ли он?
      let staff = await dbFind("staff", {Ulogin: lg});
      if (!staff.length) return "none";
      
      // Если запрашивается лог ученика или сотрудника
      if (!tip) request = {$where: function() {return (
         this.l == name && (this.d.split('-')[1]) == mon
      );}}
         
      // Если запрашивается лог всех за один час
      else {
         if (!staff[0].admin) return "none";
         if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(name)) return "none";
         request = {$where: function() {return (
            (this.d).includes(name) &&
            (this.d.split(' ')[1]).split(':')[0] == hour
         );}}
      }
      
      let resp = await dbFind("authlog", request);
      resp.sort((a, b) => (a.d <= b.d) ? 1 : -1);            
      return JSON.stringify(resp);
   }
   catch(e) {return "none";}
};
