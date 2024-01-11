/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: ИНИЦИАЛИЗАЦИЯ КОНСТАНТ И ФУНКЦИЙ
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

/* БЛОК ОПРЕДЕЛЕНИЯ КОНСТАНТ
--------------------------------------------------------------------- */

// Учебные периоды
// Указываются том порядке, в котором соответствующие итоговые отметки будут
// следовать за датой последнего дня учебного периода в таблице отметок
// и в табеле. Даты первого и последнего дней периода можно указывать
// "с запасом", не обязательно точно.
// Из этого массива ниже генерируется объект DTSIT в нужном формате

const STPER = [
   ["1ч", "Первая четверть", "01.09", "05.11"],
   ["2ч", "Вторая четверть", "06.11", "31.12"],
   ["1п", "Первое полугодие", "01.09", "31.12"],
   ["3ч", "Третья четверть", "01.01", "28.03"],
   ["4ч", "Четвертая четверть", "29.03", "15.06"],
   ["2п", "Второе полугодие", "01.01", "15.06"],
   ["Год", "Учебный год", "01.09", "25.06"]
];

// Наименования ролей пользователя
const roleNames = {
   root:    "Гл. администратор",
   admin:   "Администратор",
   teacher: "Учитель",
   tutor:   "Кл. руководитель",
   pupil:   "Учащийся",
   parent:  "Родитель"
};

// Показываемые пункты меню в зависимости от роли пользователя
let menuItems = {
   root: [
      ["users", "Пользователи"],
      ["admins", "Администраторы"],
      ["classes", "Классы"],
      ["subjects", "Предметы"]
   ],
   admin: [
      ["register", "Журнал"],
      ["absent", "Посещаемость"],
      ["attend", "Явка"],
      ["notes", "Заметки"],
      ["distrib", "Нагрузка"],
      ["groups", "Группы"],
      ["vdreg", "Внеуроч"],
      ["achsheet", "Табели"],
      ["export", "Экспорт"],
      ["stat", "Статистика"],
      ["userlog", "Лог"]
   ],
   teacher: [
      ["register", "Журнал"],
      ["attend", "Явка"],
      ["grusers", "Группы"],
      ["vdreg", "Внеуроч"],
      ["notes", "Заметки"]
   ],
   tutor: [
      ["register", "Журнал"],
      ["absent", "Посещаемость"],
      ["attend", "Явка"],
      ["docs", "Справки"],
      ["notes", "Заметки"],
      ["subgroup", "Подгруппы"],
      ["achsheet", "Табели"],
      ["vdtut", "Внеуроч"],
      ["parcodes", "Родители"],
      ["export", "Экспорт"],
      ["userlog", "Лог"]
   ],
   pupil: [
      ["journal", "Дневник"],
      ["achsheet", "Табель"],
      ["absent", "Посещаемость"],
      ["docs", "Справки"],
      ["notes", "Заметки"]
   ],
   parent: [
      ["journal", "Дневник"],
      ["achsheet", "Табель"],
      ["absent", "Посещаемость"],
      ["docs", "Справки"],
      ["notes", "Заметки"]
   ]
};

// Список предметов по умолчанию
const subjDef = {
   s110: "Русский язык",
   s120: "Литература",
   s210: "Английский язык",
   s220: "Немецкий язык",
   s230: "Французский язык",
   s310: "Искусство",
   s320: "МХК",
   s330: "Музыка",
   s410: "Математика",
   s420: "Алгебра",
   s430: "Алгебра и начала анализа",
   s440: "Геометрия",
   s450: "Информатика",
   s510: "История",
   s520: "История России",
   s530: "Всеобщая история",
   s540: "Обществознание",
   s550: "Экономика",
   s560: "Право",
   s570: "География",
   s610: "Физика",
   s620: "Астрономия",
   s630: "Химия",
   s640: "Биология",
   s710: "Технология",
   s810: "Физическая культура",
   s820: "ОБЖ"
};

// Получение объекта со списком всех предметов {"s403":"Физика", ...}
const sbListFullGet = async() => {
   let apiResp = await apireq("subjList");
   if (apiResp == "none") return {};
   let sbListDop = JSON.parse(apiResp);
   return subjSort({...subjDef, ...sbListDop})
};

// Виды документов о пропусках уроков
const sprVid = {
   med: "Справка медицинской организации",
   mp: "Справка нашего медпункта",
   par: "Записка от родителей",
   out: "Письмо сторонней организации",
   adm: "Разрешение администрации",
   tut: "Разрешение классного руководителя",
   etc: "Другое"
};

/* БЛОК ОПРЕДЕЛЕНИЯ ФУНКЦИЙ И ГЕНЕРИРОВАНИЯ НЕКОТОРЫХ ОБЪЕКТОВ
--------------------------------------------------------------------- */

// Объект функций для динамической подгрузки контента в блоки
let getContent = {};

// Просто удобное сокращение :)
const dqs = elem => document.querySelector(elem);

// regNow - текущая дата в формате 2019-09-23
// regYst, regYfin - даты начала и окончания учебного года
let regDt = new Date,
   regY = regDt.getFullYear(),
   regM = (regDt.getMonth() + 1).toString().padStart(2, "0"),
   regD = regDt.getDate().toString().padStart(2, "0"),
   regNow = `${regY}-${regM}-${regD}`;

let regYst = regDt.getMonth() > 7 ? `${regY}-09-01` : `${regY-1}-09-01`,
   regYfin = regDt.getMonth() > 7 ? `${regY+1}-06-30` : `${regY}-06-30`;

// Создание нового элемента section на странице с id="newId"
// и наполнение его содержимым inner
let elems = {};
const createSection = (newId, inner) => {
   elems[newId] = document.createElement("section");
   elems[newId].id = newId;
   elems[newId].innerHTML = inner;
   dqs("#content").appendChild(elems[newId])
};

// Запрос к API. Вызов: let apiResp = await apireq(f, z); или await apireq(f);
// Аргументы: f (имя функции API) и z (строка или объект параметров API)
// Если параметров нет, функция вызывается с одним аргументом f
// Переменные uCateg, uLogin, uToken берутся из замыкания
let apireq = async(f, z) => {
   let body = {t: uCateg, l: uLogin, p: uToken, f: f};
   if (z) body.z = z;
   let opt = {method: "POST", cache: "no-cache", body: JSON.stringify(body)};
   return await (await fetch("/", opt)).text()
};

// Преобразование даты из формата d613 в формат 13.03 (второго аргумента нет),
// либо в формат 2019-03-13 (второй аргумент ненулевой), а также обратно
// (при обратном преобразовании второй аргумент не указывается)
const dateConv = (dtInp, full) => {
   let dtOut = "";
   if (dtInp.includes("-")) {
      let dtArr = dtInp.split("-"),
          y = dtArr[0],
          m = dtArr[1],
          mNum = Number(m),
          d = dtArr[2];
      m = mNum > 8 ? mNum - 9 : mNum + 3;
      return `d${m}${d}`
   }
   else if (dtInp.includes(".")) {
      let dtArr = dtInp.split("."),
          d = dtArr[0],
          m = dtArr[1],
          mNum = Number(m);
      m = mNum > 8 ? mNum - 9 : mNum + 3;
      return `d${m}${d}`
   }
   else {
      let mNum = Number(dtInp.substr(1, 1)),
          d = dtInp.substr(2, 2);
      let m = mNum < 4 ? mNum + 9 : mNum - 3;
      m = m.toString().padStart(2, "0");
      if (full) {
         let dateObj = new Date,
             y = dateObj.getFullYear(),
             currM = dateObj.getMonth() + 1;
         if (mNum < 4 && currM < 8) y--;
         return `${y}-${m}-${d}`
      }
      else return `${d}.${m}`
   }
};

// Объект с ключами типа d628a и краткими (типа "2ч") или полными
// (типа "Вторая четверть") наименованиями учебных периодов, а также с датами
// (в формате d613) их начала и окончания (генерируется из STPER (см. выше)):
// {
//   ...
//   d628a: ["3ч",  "Третья четверть", "d401", "d628"],
//   ...
// }
let DTSIT = {},
   perLiters = "abcdefghijklmnopqrstuvwxyz";
for (let i = 0; i < STPER.length; i++) {
   let key = dateConv(STPER[i][3]) + perLiters[i];
   DTSIT[key] = [
      STPER[i][0],
      STPER[i][1],
      dateConv(STPER[i][2]),
      dateConv(STPER[i][3])
   ]
}

// Функция принимает аргумент - дату в формате d613 - и возвращает условный
// порядковый номер (число) учебного периода (первого встретившегося
// в массиве STER!), в котором находится эта дата. Если дата не принадлежит
// ни одному учебному периоду, возвращается 99
const whereis = dt => {
   let i = 1;
   for (let k in DTSIT) {
      if (dt >= DTSIT[k][2] && dt <= DTSIT[k][3]) return i;
      i++
   }
   return 99
};

// Сортировка массива названий классов и подгрупп правильным образом (11А > 1А,
// подгруппы следуют непосредственно за своими классами)
const classSort = classArr => classArr.map(x => {
   let xArr = x.split("-"),
       grName = xArr[1] ? `-${xArr[1]}` : "";
   return xArr[0].padStart(3, "0") + grName
}).sort().map(x => x.replace(/^0/, ""));

// Сортировка списка предметов правильным образом по ключам (d480 > s110)
const subjSort = sbObj => {
   let res = {};
   Object.keys(sbObj)
      .sort((k1, k2) => Number(k1.substr(1, 3)) - Number(k2.substr(1, 3)))
      .forEach(key => {res[key] = sbObj[key]});
   return res
};

// Сортировка массива, состоящего из объектов-пользователей,
// по ключу login в каждом объекте-пользователе
const userSort = usArray => usArray.sort((u1, u2) => u1.login > u2.login);

// Шаблон html-документов, отдаваемых пользователю для печати
const HTML = `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
<style>@page {size: A4; margin: 1.5cm}
   body {font: 8pt Arial, sans-serif}
   h3 {text-align:center; font-size: 10pt; text-transform: uppercase}
   p {text-align:center;}
   p.sgn {text-align:left; margin:30pt 0px 0px 3cm; line-height:3;}
   table {border-collapse: collapse; margin: 6pt auto 18pt}
   table th, table td {
      padding: 3pt; border: 0.25pt solid black; text-align: center}
   table td:first-child {text-align: left}
</style></head><body>{{body}}</body></html>`;

// Экспорт некоторых функций и объектов на серверную сторону
try {
   module.exports = {
      dtConv: dateConv, sbSort: subjSort, dtsIt: DTSIT, sbDef: subjDef,
      whereIs: whereis
   }
} catch (e) {}
