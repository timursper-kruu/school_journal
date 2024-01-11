/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: БЛОК РАБОТЫ СО СПИСКОМ АДМИНИСТРАТОРОВ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Разжалование из администраторов
// (в вызове API второй аргумент set - назначить, unset - разжаловать)
const unsetAdmin = async (login) => {
   if (!confirm("Вы уверены?")) return;
   let apiResp = await apireq("usSetAdmin", [login, "unset"]);
   if (apiResp == "none") info(1, "Запрашиваемая операция отклонена.");
   else if (apiResp == "already")
      info(1, `Пользователь ${login} не является администратором.`);
   else {
      info(0, `Пользователь ${login} успешно удален из администраторов.`);
      getContent.admins();
   }   
}

// Формирование контента странички
createSection("admins", `<h3>Администраторы</h3><table></table>`);

// Динамически подгружаем список администраторов в таблицу
// Имя метода = имени пункта меню!
getContent.admins = async () => {
   let apiResp = await apireq("adminsList");
   if (apiResp == "none") info(1, "Запрашиваемая операция отклонена.");
   else {
      let tableInner = '';
      let admListArr = userSort(JSON.parse(apiResp));
      if (!admListArr.length)
         tableInner = "<tr><td>Администраторов не найдено</td></tr>";
      else for (let currAdm of admListArr) {
         if (currAdm.block) continue;
         tableInner += `<tr>
            <td>${currAdm.Ulogin}</td>
            <td>${currAdm.Ufamil}</td>
            <td>${currAdm.Uname}</td>
            <td>${currAdm.Uotch}</td>
            <td title="Удалить из администраторов"
                onClick="unsetAdmin('${currAdm.Ulogin}')">&#9747;</td>
         </tr>`;
      }
      dqs("#admins table").innerHTML = tableInner;
   }  
}