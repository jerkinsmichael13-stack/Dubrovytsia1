/* Додатки до 3D-моделей: «Цікаве» (точки на моделі), «Екскурсія» (камера сама облітає пам'ятку),
   «Звук» (синтезовані дзвони, орган, птахи й вітер — без чужих записів), «Погода» (сніг, дощ, осінь, туман).
   Підключення:  <script src="x3d-extras.js" data-model="mykolai" defer></script>
   Сторінка моделі має віддати api:  window.x3dApi = api; document.dispatchEvent(new CustomEvent('x3d:ready', {detail: api}));
   Усі факти в точках — з описів на самих сторінках сайту та з архіву преси. */
(function(){
'use strict';
var me = document.currentScript, MODEL = me && me.dataset.model;

/* ═══════════ ТОЧКИ: координати моделі (м), заголовок, текст; v — напрям камери на екскурсії, r — відстань ═══════════ */
var SPOTS = {
  mykolai: {sound: 'bells', spots: [
    {p: [-5.4, 3.0, 0], v: [-1, .25, .35], r: 13, t: 'Західний ґанок', d: 'Головний вхід — під дзвіницею, через ґанок із поручнями. Над дверима великий білий наличник і вікно-віяло під фризом.'},
    {p: [-1.9, 9.5, 0], v: [-.6, .3, .8], r: 15, t: 'Дзвіниця', d: 'Опис 1888 року згадує при церкві дерев\'яну дзвіницю. Нині вона стоїть над входом: у кожній стіні арковий проріз із зеленими жалюзі над білою балюстрадою, вище — чотирисхилий шпиль.'},
    {p: [3.3, 3.2, 3.3], v: [.1, .2, 1], r: 13, t: 'Трапезна', d: 'Невисока трапезна на три вікна з кожного боку з\'єднує дзвіницю з центральною частиною. Над кожним вікном — білий наличник із загостреним «будиночком».'},
    {p: [10.7, 12.0, 0], v: [.35, .45, 1], r: 17, y: '1872', t: 'Баня', d: 'Церкву збудовано 1872 року коштом парафіян. «Дерев\'яна, на кам\'яному фундаменті, крита жерстю, всередині й зовні пофарбована», — так її описують «Волинські єпархіальні відомості» 1888 року.'},
    {p: [10.7, 3.4, 9.6], v: [.3, .2, 1], r: 14, y: '1913', t: 'Південний ґанок', d: '23 червня 1913 року сюди принесли раку з мощами святої Іуліанії. До її прибуття в Дубровиці зібралося понад 6 000 прочан; храм і подвір\'я всю ніч були повні людей.'},
    {p: [19.3, 3.2, 0], v: [1, .25, -.3], r: 14, y: '1790', t: 'Вівтар', d: 'Нижча вівтарна частина зі сходу. Метричні книги парафії, за описом 1888 року, зберігалися від 1790-го.'}
  ]},
  cerkva: {sound: 'bells', spots: [
    {p: [-18.1, 5.0, 6.6], v: [-.5, .2, 1], r: 16, y: '1537', t: 'Головний вхід', d: 'Перша відома згадка про Пречистенську церкву «вище міста» — 1537 року, у заповіті князя Юрія Гольшанського-Дубровицького.'},
    {p: [-17.4, 24.0, 0], v: [-.7, .35, .7], r: 20, t: 'Дзвіниця', d: 'Одна з трьох бань стоїть над дзвіницею. Три бані по одній осі — над дзвіницею, над барабаном і над вівтарем — схема, успадкована від дерев\'яних церков Полісся.'},
    {p: [0, 19.5, 0], v: [.2, .45, 1], r: 22, y: '1861', t: 'Барабан і баня', d: 'Нинішню муровану церкву звели 1861 року коштом графа Ігнатія Броель-Плятера. Восьмигранний барабан стоїть над середохрестям.'},
    {p: [0, 7.0, 7.6], v: [0, .2, 1], r: 18, y: '1892', t: 'Бічний фасад', d: '1892 року парафія сягнула 4 439 вірян — найбільше за всю її історію.'},
    {p: [11.0, 10.5, 0], v: [1, .3, .4], r: 18, y: '1962', t: 'Вівтарна баня', d: '1962 року радянська влада закрила храм і зробила в ньому склад солі. Будівлю мали підірвати; наказ скасував начальник міліції Дмитро Башинський. 1992-го громаду зареєстрували знову, храм відреставрували.'}
  ]},
  kostel: {sound: 'organ', spots: [
    {p: [0, 3.2, .6], v: [0, .15, 1], r: 18, y: '1681', t: 'Головний вхід', d: 'Ян Кароль Дольський записує піарам 35 тисяч злотих на костел і колегіум.'},
    {p: [0, 10.7, .6], v: [.15, .2, 1], r: 20, t: 'Напис на фризі', d: '«SAMEMU BOGU CZESC I CHWALA» — «Самому Богові честь і слава». На будівлі напис зроблено без польських діакритиків.'},
    {p: [8.2, 28.0, -2.8], v: [.6, .3, 1], r: 24, y: '1740', t: 'Вежі', d: 'Нинішню муровану базиліку зведено 1740 року, за ректора Казимира Пнєвського. Пам\'ятка архітектури національного значення, № 1497.'},
    {p: [0, 22.0, -14], v: [1, .5, .2], r: 28, y: '1742', t: 'Неф', d: 'Костел освятив 1742 року єпископ Франциск Кобельський.'},
    {p: [0, 13.0, -29.5], v: [.8, .3, -1], r: 22, y: '1945', t: 'Пресвітерій', d: '1945 року костел зачинили: дзвони вивезли, орган знищили, будівлю віддали під склад. 1992-го його повторно освятили й повернули громаді.'}
  ]},
  worobin: {sound: 'nature', spots: [
    {p: [-12.4, 7.0, 0], v: [-1, .2, .25], r: 20, t: 'Західний портик', d: 'Чотири дорицькі колони великого ордера, фронтон із круглим вікном і дев\'ять кам\'яних сходинок на всю ширину; обабіч сходів — кам\'яні плити під вазони.'},
    {p: [0, 6.5, 11.8], v: [.15, .2, 1], r: 22, y: '1775', t: 'Південна колонада', d: 'Шість колон уздовж усього фасаду, над ними аттик. Воробинську книгозбірню 1775 року почав збирати Юзеф Антоній Плятер.'},
    {p: [8.6, 5.0, 0], v: [1, .2, -.2], r: 20, y: '1887', t: 'Фасад до Горині', d: 'П\'ять заокруглених ніш на всю висоту. Схил тут спадає, тож видно цокольний поверх із віконцями. 1887 року павільйон перебудували під житло: великі зали поділили на кімнати.'},
    {p: [0, 15.5, -10.8], v: [-.3, .35, -1], r: 22, t: 'Вежа', d: 'Двоповерхова квадратна вежа на півночі під високим гострим дахом. Північний фасад відтворено за описом.'},
    {p: [-3, 11.5, 0], v: [-.5, .7, .6], r: 26, y: '1918', t: 'Кінець Воробина', d: '22 листопада 1918 року, під час Домбровицького повстання, маєток спалили. На фотографіях 1937 року павільйон уже покинутий, із забитими вікнами, а в Другу світову його знищили повністю.'}
  ]}
};
/* ═══════════ ЕКСКУРСІЇ: розділи з камерою (s — номер точки або p/v/r), текстом і, наприкінці, посиланнями.
   Озвучення — файли audio/tour/<модель>-<n>.mp3 (диктор синтезований з цих самих текстів) ═══════════ */
var TOURS = {"kostel":[{"cam":{"p":[0,12,-14],"v":[0.8,0.35,0.9],"r":22},"t":"Найстаріша споруда міста","d":"Перед вами костел Іоанна Хрестителя — найстаріша збережена споруда Дубровиці й пам'ятка архітектури національного значення. За його мурами — понад три століття історії: школа, війни, грабунки й повернення."},{"cam":{"s":0},"t":"Фундація","y":"1681","d":"12 жовтня 1681 року Ян Кароль Дольський записав ордену піарів 35 тисяч злотих — з умовою, щоб при костелі завжди служили дванадцять ксьондзів. Піари, засновані в Римі 1617 року, навчали бідних, тож разом із костелом у Дубровиці з'явився колегіум — одна з небагатьох шкіл тогочасного Полісся."},{"cam":{"p":[0,8,-14],"v":[1,0.25,0.15],"r":20},"t":"Згорілий костел і цар","y":"1709","d":"Перший костел, дерев'яний, стояв недовго: 1709 року, після Полтавської битви, його спалили шведи. А навесні 1710-го в кляшторі піарів зупинився Петро I — і на прощання дав грамоту, що звільняла кляштор від постою російських військ."},{"cam":{"s":2},"t":"Мурована базиліка","y":"1740","d":"1722 року мурований костел лише починали: Вишневецький дозволив піарам брати глину для цегельні за Воробином. Звели його 1740 року, за ректора Казимира Пнєвського, освятили 1742-го. Це трьохнавна базиліка в стилі рококо з двома вежами на фасаді."},{"cam":{"s":1},"t":"Школа піарів","y":"1688–1832","d":"Школа піарів була другою на Волині після Межиріцької. Тут викладали математику, філософію й нові іноземні мови, а для молодих ченців ордену діяв ще й вищий клас. 1688 року тут навчалося 30 учнів, згодом — до ста, а в середині XVIII століття колегіум так славився, що сюди з'їжджалася шляхетська молодь навіть із далеких країв Польщі. Серед учнів — Кипріан Годебський, Алоїзій Фелінський, Лукаш Голембйовський. Та коли школу передали Едукаційній комісії, її перетворили на трикласне повітове училище, і вона почала занепадати — не врятувала навіть підтримка Плятерів. 1832 року колегіум закрили, а його архів і маєтки забрала держава. Від школи лишилася тільки бібліотека отців піарів — ще 1938 року вона зберігалася при костелі."},{"cam":{"s":4},"t":"Скарби інтер'єру","d":"Усередині — хрестові склепіння й різьблені вівтарі. Головний образ, святого Іоанна Хрестителя, написав Лукаш Губель — піар із Любешова, і цей образ дивом уцілів. А найціннішим скарбом був вітраж, виготовлений у Венеції, — єдиний такий на все Полісся. Від нього не лишилося ні фрагмента, ні світлини."},{"cam":{"s":3},"t":"Церква, що врятувала костел","d":"Після закриття кляштору костел мали передати під православну церкву. Щоб урятувати його, граф Ігнацій Плятер заснував у містечку муровану церкву такої самої величини — нинішню церкву Різдва Богородиці. І костел лишився костелом: обидві святині Дубровиці вціліли завдяки одному рішенню."},{"cam":{"p":[0,12,-14],"v":[-0.8,0.4,0.6],"r":22},"t":"Склад і повернення","y":"1945","d":"1945 року радянська влада зачинила костел. Дзвони вивезли, орган розібрали, срібло й ікони розграбували, а стіни перефарбували з білого в червоний і зробили тут склад. Так тривало понад сорок років — аж до 1992-го, коли костел знову освятили й повернули громаді.","links":[["Історія костелу й інтер'єр","architecture.html"],["Церква Різдва Богородиці в 3D","cerkva-3d.html"],["Плятери на Дубровиці","plater.html"]]}],"cerkva":[{"cam":{"p":[-3,10,0],"v":[-0.6,0.35,0.9],"r":20},"t":"Друга святиня Дубровиці","d":"Церква Різдва Пресвятої Богородиці — пам'ятка архітектури національного значення. Нинішній храм звели 1861 року, але на цьому місці, «вище міста», моляться вже майже п'ять століть."},{"cam":{"s":0},"t":"Князі Гольшанські","y":"1537","d":"1537 року князь Юрій Гольшанський-Дубровицький у заповіті назвав три дубровицькі церкви — соборну Спаса, Пречистої «вище міста» та Благовіщенську — і кожній записав по п'ять кіп грошей. Пречиста «вище міста» — попередниця нинішнього храму."},{"cam":{"p":[-3,7,8],"v":[0.1,0.2,1],"r":18},"t":"Дар княжни","y":"1576","d":"Його донька Марія 1576 року заповіла передати Пречистенській церкві мале Євангеліє в червоному оксамиті й золоченому сріблі, ще одне — в чорному оксамиті, та срібний визолочений хрест."},{"cam":{"p":[-12,6,7],"v":[-0.3,0.25,1],"r":16},"t":"Свята Юліанія","d":"Інша донька князя Юрія, Юліанія, померла на шістнадцятому році життя і стала святою: її мощі спочивають у Ближніх печерах Києво-Печерської лаври. 2005 року поруч із цією церквою освятили пам'ятник святій Юліанії."},{"cam":{"s":2},"t":"Храм від графа Плятера","y":"1861","d":"Муровану церкву звели 1861 року коштом графа Ігнатія Броель-Плятера. І звів він її не лише для православних: костел тоді мали віддати під церкву, а новий храм такої самої величини врятував його. Тож обидві головні святині Дубровиці вціліли завдяки одному рішенню."},{"cam":{"s":1},"t":"Три бані на одній осі","d":"Бані стоять у ряд — над дзвіницею, над восьмигранним барабаном і над вівтарем. Так будували дерев'яні церкви Полісся, а дзвіниця на західному фасаді — риса російської традиції. Восьмерик дзвіниці прикрашають щипці."},{"cam":{"s":3},"t":"Найбільша парафія","y":"1892","d":"1892 року парафія сягнула 4 439 вірян — найбільше за всю історію. При церкві діяло однокласне народне училище, до неї були приписані навколишні села."},{"cam":{"s":4},"t":"Врятована від вибуху","y":"1962","d":"1962 року радянська влада закрила храм і зробила з нього склад солі. Будівлю вирішили підірвати: з Луцька вже приїхали мінери з вибухівкою. В останню мить начальник райвідділу міліції Дмитро Башинський скасував наказ — і храм уцілів. 25 вересня 1992 року громаду зареєстрували знову, а церкву відреставрували.","links":[["Історія церкви","architecture.html#cerkva"],["Костел у 3D","kostel-3d.html"],["Плятери на Дубровиці","plater.html"]]}],"worobin":[{"cam":{"p":[-13.5,2,3.5],"v":[-1,0.42,-0.5],"r":16,"rm":1.2},"scene":"count","t":"Резиденція Плятерів","d":"Цієї будівлі давно немає. Перед вами реконструкція павільйону «Бібліотека» з Воробина — резиденції графів Плятерів за три кілометри від Дубровиці. Чотири покоління, тисячі книжок, картини старих майстрів — і трагічний кінець 1918 року."},{"cam":{"p":[-17,1.5,0],"v":[-0.75,0.4,0.8],"r":16.5,"rm":1.2},"scene":"carriage","t":"Маєток за борги","y":"1775","d":"Дубровиця дісталася Плятерам не купівлею. 1775 року через борги Бжостовських сейм призначив розподіл їхнього майна, і литовський Трибунал присудив Дубровицю Юзефу Антонію Плятеру — графу, мальтійському командору, згодом послу Великого сейму. Маєтки охоплювали близько 60 тисяч гектарів, половину з них — болота."},{"cam":{"p":[-4,1.0,-9.5],"v":[-0.65,0.45,-0.9],"r":22,"rm":1.15},"scene":"life","t":"Палац, якого не збудували","d":"Старий дубровицький замок над Горинню давно лежав у руїнах, тож Плятери осіли у фільварку Воробин. Старий дерев'яний двір розібрали під новий палац — але палац так і не постав. До 1918 року родина жила в офіцинах, а цей павільйон звели на схилі над лугами Горині як частину майбутнього ансамблю — спершу лише для книжок."},{"cam":{"s":2},"scene":"library","t":"Бібліотека й скарби","y":"1914","d":"1914 року бібліотека мала близько 8 000 томів, а родинний архів — понад 200 томів листів і паперів. У галереї висіли голландські полотна й образ Богоматері Скорботної, який уважали оригіналом Доменікіно; були порцеляна з Корця й Баранівки, старе срібло, слуцькі пояси."},{"cam":{"p":[4,1.2,8],"v":[0.45,0.42,1],"r":23,"rm":1.15},"scene":"couple","t":"Парк над Горинню","d":"Будинки потопали в пейзажному парку на двох рівнях: угорі — офіцини й «Бібліотека», внизу — мальовничі ставки. Росли білі тополі, липи, високі ялини, ясени й каштани. 1887 року павільйон перебудували під житло, поділивши великі зали на кімнати."},{"cam":{"p":[-1,4.5,0],"v":[0.75,0.36,0.8],"r":27},"t":"Господарі","d":"Нащадки примножували маєток. Віктор Плятер, випускник Сен-Сіра, одним із перших у краї запровадив раціональне лісове господарство й осушував болота під луки. Його брат Влодзімеж, історик і бібліофіл, перевозив бібліотеку до Вишнівця, а 1876 року повернув її до Дубровиці."},{"cam":{"p":[-2,6,0],"v":[-0.7,0.32,0.75],"r":30},"scene":"fire","t":"Кінець Воробина","y":"1918","d":"У ніч на 22 листопада 1918 року в Дубровиці спалахнуло збройне повстання проти гетьманської влади. Повстанці роззброїли гетьманську варту, зайняли пошту й залізничну станцію — і рушили на Воробин. Маєток боронився до другої години дня, а коли будинок підпалили, оборонці склали зброю за умови, що їх відпустять. Жінок відвели до містечка, а 22 чоловіків — братів Ігнація та Антонія Плятерів і двадцятьох службовців маєтку — розстріляли на дорозі до Дубровиці. Повстанці ще близько трьох місяців тримали округу. Радянська преса десятиліттями славила їх як героїв, а польський суд 1939 року називав «бандою грабіжників»."},{"cam":{"p":[-3,4.5,0],"v":[-0.85,0.3,0.5],"r":27},"t":"Що лишилося","d":"Загиблих у Воробині 1919 року поховали на дубровицькому кладовищі. Між війнами павільйон лише накрили новим дахом, щоб він не руйнувався далі; на фото 1937 року він уже покинутий, із забитими вікнами. У Другу світову війну Воробин знищили повністю, і нині на місці маєтку стоїть лікарня. А церква Різдва Богородиці, збудована коштом Ігнатія Плятера, досі височіє в центрі Дубровиці.","links":[["Плятери й Воробин","plater.html"],["Церква Різдва Богородиці в 3D","cerkva-3d.html"],["Костел у 3D","kostel-3d.html"]]}],"mykolai":[{"cam":{"p":[7.7,6,0],"v":[-0.6,0.35,0.9],"r":14},"t":"Церква на передмісті","y":"1872","d":"Свято-Миколаївська церква — дерев'яний храм на передмісті Дубровиці. Її збудували 1872 року коштом самих парафіян."},{"cam":{"s":3},"t":"Як її описали 1888 року","d":"«Дерев'яна, на кам'яному фундаменті, крита жерстю, всередині й зовні пофарбована; іконостас новий», — писали «Волинські єпархіальні відомості» 1888 року. Метричні книги парафії тоді зберігалися ще від 1790 року."},{"cam":{"s":1},"t":"Дзвіниця","d":"1888 року при церкві стояла дерев'яна дзвіниця. Нині дзвіниця височіє над західним входом: з кожного боку — арковий проріз із зеленими жалюзі над білою балюстрадою, вище — гострий чотирисхилий шпиль."},{"cam":{"s":5},"t":"Спадщина монастиря","d":"Місце давнє. 1913 року церкву й цвинтар при ній називали спадщиною давнього Миколаївського монастиря, де трудилися ченці."},{"cam":{"s":4},"t":"Мощі святої Іуліанії","y":"1913","d":"23 червня 1913 року сюди принесли раку з мощами святої Іуліанії. Прочани сходилися ще з 22 червня, і до прибуття святині в Дубровиці зібралося понад 6 000 людей. Назустріч виходили майже до села Бережки, а храм і подвір'я всю ніч були повні."},{"cam":{"p":[7.7,6,0],"v":[0.7,0.4,0.8],"r":14},"t":"Нове вбрання","d":"Сьогодні церква — у синьому вбранні: темно-сині й зелені пілястри, білі наличники над вікнами, фриз із білих філенок і срібляста баня. Обійдіть її довкола — або поставте собі на стіл кнопкою «Переглянути у себе»."}]};
var CFG = SPOTS[MODEL]; if (!CFG) return; CFG.tour = TOURS[MODEL] || [];
var AUDIO = new URL('audio/tour/', me.src).href;

var ICON = {
  spots: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17.5s5.5-5 5.5-9.3a5.5 5.5 0 0 0-11 0c0 4.3 5.5 9.3 5.5 9.3z"/><circle cx="10" cy="8.2" r="1.9"/></svg>',
  tour: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7.2"/><path d="M8.3 6.9v6.2l4.9-3.1z" fill="currentColor" stroke="none"/></svg>',
  sound: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.6h2.8L10 4.5v11L6.3 12.4H3.5z"/><path class="w1" d="M13 7.4a3.6 3.6 0 0 1 0 5.2"/><path class="w2" d="M15.2 5.3a6.6 6.6 0 0 1 0 9.4"/><path class="mx" d="M13.2 7.8l4 4.4M17.2 7.8l-4 4.4"/></svg>',
  weather: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14.2h8.2a3.4 3.4 0 0 0 .3-6.8 4.6 4.6 0 0 0-8.9 1.2A2.8 2.8 0 0 0 6 14.2z"/><path d="M7.5 16.8l-.6 1.3M10.5 16.8l-.6 1.3M13.5 16.8l-.6 1.3"/></svg>'
};
var WEATHER = [['clear', 'Ясно'], ['snow', 'Зима'], ['rain', 'Дощ'], ['autumn', 'Осінь'], ['fog', 'Туман']];

var CSS = [
  '.xr{position:fixed;z-index:3;right:clamp(14px,2.4vw,32px);bottom:calc(env(safe-area-inset-bottom,0px) + 24px);display:flex;flex-direction:column;gap:6px;padding:5px;border-radius:999px;border:1px solid var(--faint);background:rgba(23,18,11,.62);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}',
  '.xr button{position:relative;display:grid;place-items:center;width:42px;height:42px;border:0;border-radius:50%;background:none;color:var(--text);cursor:pointer;transition:background .2s,color .2s}',
  '.xr button:hover{background:rgba(244,233,200,.08)}.xr button[aria-pressed="true"]{background:rgba(212,178,90,.2);color:var(--gold)}',
  '.xr svg{width:20px;height:20px}.xr button[aria-pressed="false"] .w1,.xr button[aria-pressed="false"] .w2{display:none}.xr button[aria-pressed="true"] .mx,.xr button:not([aria-pressed]) .mx{display:none}',
  '.xr button::after{content:attr(data-l);position:absolute;right:calc(100% + 10px);top:50%;transform:translateY(-50%);padding:.3rem .6rem;border-radius:8px;background:rgba(23,18,11,.88);color:var(--text);font:500 .72rem var(--body);white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s}',
  '.xr button:hover::after,.xr button:focus-visible::after{opacity:1}',
  '.xw{position:fixed;z-index:4;right:calc(clamp(14px,2.4vw,32px) + 62px);bottom:calc(env(safe-area-inset-bottom,0px) + 24px);display:flex;flex-direction:column;gap:2px;padding:5px;border-radius:16px;border:1px solid var(--faint);background:rgba(23,18,11,.82);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;visibility:hidden;transform:translateX(6px);transition:opacity .25s,visibility .25s,transform .25s}',
  '.xw.open{opacity:1;visibility:visible;transform:none}',
  '.xw button{padding:.5rem .95rem;border:0;border-radius:11px;background:none;color:var(--text);font:500 .78rem var(--body);text-align:left;cursor:pointer}',
  '.xw button:hover{background:rgba(244,233,200,.08)}.xw button[aria-pressed="true"]{background:rgba(212,178,90,.2);color:var(--gold)}',
  '.xm{position:fixed;inset:0;z-index:2;pointer-events:none;overflow:hidden}',
  /* markers: a small gilded point with a soft halo; its name slides out on hover and while it is the one being told about */
  '.xp{position:absolute;left:0;top:0;width:30px;height:30px;margin:-15px 0 0 -15px;padding:0;border:0;background:none;cursor:pointer;pointer-events:auto;transition:opacity .35s;will-change:transform;-webkit-tap-highlight-color:transparent}',
  '.xp i{position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff6d8,#e2bd62 55%,#a8822c);',
  '  box-shadow:0 0 0 1.5px rgba(23,18,11,.55),0 0 10px 2px rgba(255,214,120,.55);transition:transform .25s cubic-bezier(.16,1,.3,1)}',
  '.xp i::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:1px solid rgba(240,210,140,.55);animation:xpHalo 3.2s ease-in-out infinite}',
  '.xp span{position:absolute;left:24px;top:50%;transform:translate(-6px,-50%);padding:.28rem .62rem .3rem;border-radius:999px;white-space:nowrap;border:1px solid rgba(212,178,90,.45);',
  '  background:rgba(23,18,11,.8);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#f4e9c8;font:400 .9rem/1 var(--display);letter-spacing:.01em;opacity:0;pointer-events:none;transition:opacity .25s,transform .3s cubic-bezier(.16,1,.3,1)}',
  '.xp.l span{left:auto;right:24px;transform:translate(6px,-50%)}',
  '.xp:hover i,.xp.on i{transform:scale(1.35)}',
  '.xp:hover span,.xp.on span,.xp:focus-visible span{opacity:1;transform:translate(0,-50%)}',
  '.xp:focus-visible{outline:none}.xp:focus-visible i{box-shadow:0 0 0 2px #f4e9c8,0 0 12px 3px rgba(255,214,120,.7)}',
  '.xp.hid{opacity:0;pointer-events:none}.xp.dim{opacity:0;pointer-events:none}.xp.dim.on{opacity:.55}',
  '.xm.off .xp{opacity:0;pointer-events:none}',
  '@keyframes xpHalo{0%,100%{transform:scale(.75);opacity:.85}50%{transform:scale(1.15);opacity:.25}}',
  '.xc{position:fixed;z-index:4;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 132px);width:min(430px,calc(100vw - 32px));padding:1.05rem 1.2rem 1rem;border-radius:18px;border:1px solid rgba(212,178,90,.3);',
  '  background:linear-gradient(180deg,rgba(46,37,23,.94),rgba(23,18,11,.94));backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:var(--text);box-shadow:0 18px 50px rgba(0,0,0,.45);',
  '  transform:translate(-50%,10px);opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s,transform .35s cubic-bezier(.16,1,.3,1)}',
  '.xc.open{opacity:1;visibility:visible;transform:translate(-50%,0)}',
  '.xc-h{display:flex;align-items:baseline;gap:.6rem;margin:0 4.5rem .35rem 0}.xc.tour .xc-h{margin-right:0}.xc-h b{font:400 1.35rem/1.1 var(--display)}.xc-h span{font:400 1.05rem var(--display);color:var(--gold)}',
  '.xc p{margin:0;font:400 .84rem/1.55 var(--body);color:rgba(244,233,200,.84)}',
  '.xc-f{display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin-top:.8rem}',
  '.xc-n{font:500 .7rem var(--body);letter-spacing:.08em;color:var(--muted)}',
  '.xc-b{display:flex;gap:.35rem}.xc-b button{display:inline-flex;align-items:center;gap:.35rem;padding:.4rem .8rem;border-radius:999px;border:1px solid var(--faint);background:none;color:var(--text);font:500 .74rem var(--body);cursor:pointer}',
  '.xc-b button:hover{border-color:var(--gold)}.xc-b button.pri{border-color:rgba(212,178,90,.55);background:rgba(212,178,90,.16)}',
  '.xc-tools{position:absolute;right:.5rem;top:.5rem;display:flex;gap:2px}',
  '.xc-x,.xc-v{display:grid;place-items:center;width:32px;height:32px;border:0;border-radius:50%;background:none;color:var(--muted);font-size:1.2rem;cursor:pointer}.xc-x:hover,.xc-v:hover{color:var(--text);background:rgba(244,233,200,.08)}',
  '.xc-v{display:none}.xc.tour .xc-v{display:grid}.xc.nov .xc-v{display:none!important}.xc-v svg{width:18px;height:18px}.xc-v[aria-pressed="false"] .w1,.xc-v[aria-pressed="false"] .w2{display:none}.xc-v[aria-pressed="true"] .mx{display:none}.xc-v[aria-pressed="true"]{color:var(--gold)}',
  '.xc-k{margin:0 4.5rem .3rem 0;font:600 .6rem var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}.xc-k:empty{display:none}',
  '.xc-d{max-height:42vh;overflow:auto;overscroll-behavior:contain}',
  '.xc-l{display:none;flex-direction:column;gap:.35rem;margin-top:.8rem;padding-top:.75rem;border-top:1px solid rgba(212,178,90,.22)}.xc.has-l .xc-l{display:flex}',
  '.xc-l a{font:600 .8rem var(--body);color:var(--gold);text-decoration:none}.xc-l a:hover{text-decoration:underline}',
  '.xc-pp{display:none!important;width:34px;justify-content:center;padding:0!important}.xc.tour .xc-pp{display:inline-flex!important}.xc-pp svg{width:11px;height:11px}.xc-pp .pl{display:none}.xc.paused .xc-pp .pl{display:block}.xc.paused .xc-pp .pz{display:none}',
  '.xc-p{position:absolute;left:1.2rem;right:1.2rem;bottom:0;height:2px;border-radius:2px;background:rgba(244,233,200,.1);overflow:hidden}.xc-p i{display:block;height:100%;width:0;background:var(--gold)}',
  '.xo{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:0;transition:opacity 1.2s,background 1.2s}',
  '#view{z-index:1}',
  '@media(min-width:900px){.xc{left:clamp(16px,3vw,36px);bottom:calc(env(safe-area-inset-bottom,0px) + 104px);width:min(380px,30vw);transform:translateY(10px)}.xc.open{transform:none}}',
  '@media(max-width:640px){.xr{right:10px;bottom:auto;top:31%;z-index:5}.xr button{width:40px;height:40px}.xr button::after{display:none}',
  '  .xw{right:64px;bottom:auto;top:31%;z-index:5;transform:translateX(6px)}.xw.open{transform:none}',
  '  .xc{left:12px;right:12px;width:auto;bottom:calc(env(safe-area-inset-bottom,0px) + 86px);padding:.85rem .95rem .8rem;transform:translateY(10px)}.xc.open{transform:none}',
  '  body.xc-on .top,body.xc-on .xr~.arb{opacity:0;pointer-events:none}.top{transition:opacity .4s}',
  '  body.xc-on .xr{top:calc(env(safe-area-inset-top,0px) + 12px);flex-direction:row}body.xc-on .xw{top:calc(env(safe-area-inset-top,0px) + 70px);right:10px}',
  '  .xc-h b{font-size:1.15rem}.xc p{font-size:.78rem;line-height:1.5}.xc-f{margin-top:.55rem}.xc-d{max-height:24vh}}',
  '@media(prefers-reduced-motion:reduce){.xp i::after{animation:none}.xc,.xw,.xo{transition:none}}'
].join('\n');

function el(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function init(api){
  if (init.done || !api || !api.camera || !api.model) return; init.done = true;
  var T = window.THREE, cam = api.camera, ctl = api.controls, scene = api.scene;
  var st = el('style'); st.textContent = CSS; document.head.appendChild(st);

  /* ── rail ── */
  var rail = el('div', 'xr'); rail.setAttribute('role', 'toolbar'); rail.setAttribute('aria-label', 'Додатково');
  function rb(key, label, pressed){ var b = el('button', null, ICON[key]); b.type = 'button'; b.dataset.l = label; b.setAttribute('aria-label', label); if (pressed != null) b.setAttribute('aria-pressed', String(pressed)); rail.appendChild(b); return b; }
  var bSpots = rb('spots', 'Цікаве на моделі', true), bTour = rb('tour', 'Екскурсія'), bSound = rb('sound', 'Звук', false), bWeather = rb('weather', 'Погода й пора року', false);
  document.body.appendChild(rail);

  /* ── markers ── */
  var layer = el('div', 'xm'); document.body.appendChild(layer);
  var spots = CFG.spots.map(function(s, i){
    var b = el('button', 'xp', '<i></i><span></span>'); b.querySelector('span').textContent = s.t; b.type = 'button'; b.setAttribute('aria-label', (i + 1) + '. ' + s.t);
    b.addEventListener('click', function(e){ e.stopPropagation(); stopTour(); show(i); });
    layer.appendChild(b);
    return {s: s, b: b, v: new T.Vector3(s.p[0], s.p[1], s.p[2]), occ: false};
  });
  var ray = new T.Raycaster(), tmp = new T.Vector3(), fwd = new T.Vector3(), lastOcc = 0;
  /* pin each marker to the surface seen from its tour direction, so it is not buried inside a wall or roof */
  api.model.updateMatrixWorld(true);
  spots.forEach(function(o){
    var s = o.s; if (!s.v) return;
    var d = new T.Vector3(s.v[0], s.v[1], s.v[2]).normalize(), from = o.v.clone().addScaledVector(d, 80);
    ray.set(from, d.clone().negate()); ray.far = 80;
    var hit = ray.intersectObject(api.model, true).filter(function(h){ return h.object.material && h.object.material.colorWrite !== false; });
    if (hit.length) o.v.copy(hit[0].point).addScaledVector(d, .35);
  });
  function place(now){
    var w = innerWidth, h = innerHeight, rect = api.renderer.domElement.getBoundingClientRect();
    if (now - lastOcc > 160){ lastOcc = now;
      spots.forEach(function(o){ var d = o.v.distanceTo(cam.position); tmp.copy(o.v).sub(cam.position).normalize(); ray.set(cam.position, tmp); ray.far = d;
        var hit = ray.intersectObject(api.model, true); o.occ = hit.length > 0 && hit[0].distance < d - .6; }); }
    cam.getWorldDirection(fwd);
    spots.forEach(function(o){
      var ahead = tmp.copy(o.v).sub(cam.position).dot(fwd) > .5;
      tmp.copy(o.v).project(cam);
      var vis = ahead && tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
      o.b.classList.toggle('hid', !vis); o.b.classList.toggle('dim', vis && o.occ);
      if (vis){ var sx = rect.left + (tmp.x + 1)/2*rect.width; o.b.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + (rect.top + (1 - tmp.y)/2*rect.height).toFixed(1) + 'px)'; o.b.classList.toggle('l', sx > w*.6); }
    });
  }
  var spotsOn = true;
  bSpots.addEventListener('click', function(){ spotsOn = !spotsOn; bSpots.setAttribute('aria-pressed', String(spotsOn)); layer.classList.toggle('off', !spotsOn); if (!spotsOn) closeCard(); });

  /* ── card ── */
  var SPK = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.6h2.8L10 4.5v11L6.3 12.4H3.5z"/><path class="w1" d="M13 7.4a3.6 3.6 0 0 1 0 5.2"/><path class="w2" d="M15.2 5.3a6.6 6.6 0 0 1 0 9.4"/><path class="mx" d="M13.2 7.8l4 4.4M17.2 7.8l-4 4.4"/></svg>';
  var card = el('section', 'xc'); card.setAttribute('aria-live', 'polite');
  card.innerHTML = '<div class="xc-tools"><button type="button" class="xc-v" data-a="voice" aria-pressed="true" aria-label="Озвучення" title="Озвучення">' + SPK + '</button><button type="button" class="xc-x" aria-label="Закрити">×</button></div>' +
    '<p class="xc-k"></p><div class="xc-h"><b></b><span></span></div><p class="xc-d"></p><div class="xc-l"></div>' +
    '<div class="xc-f"><span class="xc-n"></span><div class="xc-b"><button type="button" data-a="prev" aria-label="Назад">←</button>' +
    '<button type="button" data-a="pause" class="xc-pp" aria-label="Пауза"><svg viewBox="0 0 14 14" fill="currentColor"><path class="pz" d="M3 2h3v10H3zM8 2h3v10H8z"/><path class="pl" d="M3.5 1.8v10.4L12 7z"/></svg></button>' +
    '<button type="button" data-a="next" class="pri">Далі →</button></div></div><div class="xc-p"><i></i></div>';
  document.body.appendChild(card);
  var cur = -1, $k = card.querySelector('.xc-k'), $t = card.querySelector('.xc-h b'), $y = card.querySelector('.xc-h span'), $d = card.querySelector('.xc-d'), $l = card.querySelector('.xc-l'), $n = card.querySelector('.xc-n'), $next = card.querySelector('[data-a="next"]');
  function fill(o, kicker, count){
    $k.textContent = kicker || ''; $t.textContent = o.t; $y.textContent = o.y || ''; $d.textContent = o.d; $n.textContent = count;
    $l.innerHTML = ''; (o.links || []).forEach(function(L){ var a = el('a', null); a.href = L[1]; a.textContent = L[0] + ' →'; $l.appendChild(a); });
    card.classList.toggle('has-l', !!(o.links && o.links.length)); card.querySelector('.xc-d').scrollTop = 0;
    card.classList.add('open'); document.body.classList.add('xc-on');
  }
  function show(i, fromTour){
    cur = (i + spots.length) % spots.length;
    fill(spots[cur].s, '', (cur + 1) + ' / ' + spots.length); card.classList.remove('tour');
    spots.forEach(function(o, k){ o.b.classList.toggle('on', k === cur); });
    if (!fromTour) fly(spotCam(cur), 1400);
  }
  function closeCard(){ card.classList.remove('open', 'tour'); document.body.classList.remove('xc-on'); spots.forEach(function(o){ o.b.classList.remove('on'); }); cur = -1; }
  card.querySelector('.xc-x').addEventListener('click', function(){ stopTour(); closeCard(); });
  card.addEventListener('click', function(e){ var a = e.target.closest('[data-a]'); if (!a) return; var k = a.dataset.a;
    if (k === 'voice'){ voiceOn = !voiceOn; a.setAttribute('aria-pressed', String(voiceOn)); if (touring){ if (voiceOn) narrate(tIdx, true); else hush(); retime(); } return; }
    if (k === 'pause'){ if (touring){ if (paused) resumeTour(); else pauseTour(); } return; }
    if (touring){ tourStep(k === 'next' ? 1 : -1); return; }
    show(cur + (k === 'next' ? 1 : -1)); });

  /* ── camera flights ── */
  var box = new T.Box3().setFromObject(api.model), centre = box.getCenter(new T.Vector3()), size = box.getSize(new T.Vector3());
  var flight = null;
  function spotCam(i){ var s = spots[i].s; return {pt: spots[i].v, v: s.v, r: s.r}; }
  function chapterCam(c){ if (c.s != null) return spotCam(c.s); return {pt: new T.Vector3(c.p[0], c.p[1], c.p[2]), v: c.v, r: c.r, rm: c.rm, wide: true}; }
  function viewFor(c){
    var p = c.pt, d;
    if (c.v) d = new T.Vector3(c.v[0], c.v[1], c.v[2]);
    else { d = new T.Vector3(p.x - centre.x, 0, p.z - centre.z); if (d.lengthSq() < .01) d.copy(cam.position).sub(p).setY(0); d.normalize().setY(.3); }
    d.normalize();
    var r = (c.r || Math.max(size.x, size.z)*.6)*Math.max(1.9, size.y/13)*(innerWidth < 700 ? c.rm || 1.75 : 1);
    var t = c.wide ? p.clone() : p.clone().lerp(new T.Vector3(centre.x, Math.min(p.y, centre.y), centre.z), .35);   // keep the building in frame
    var pos = t.clone().addScaledVector(d, r); pos.y = Math.max(pos.y, 1.2);
    if (innerWidth < 700){ var dy = r*.085; t.y -= dy; pos.y -= dy; }   // the card covers the lower half on a phone: keep the subject above it
    else if (innerWidth >= 900){ var side = new T.Vector3().crossVectors(new T.Vector3(0, 1, 0), d).normalize(); var sh = r*.16; t.addScaledVector(side, -sh); pos.addScaledVector(side, -sh); }   // the card sits on the left: move the view left so the subject sits right of it
    return {t: t, p: pos};
  }
  function fly(c, ms){
    api.autoRotate(false); var v = viewFor(c);
    flight = {t0: performance.now(), ms: reduced ? 1 : ms, a: {t: ctl.target.clone(), p: cam.position.clone()}, b: v};
  }
  function stepFlight(now){
    if (!flight) return;
    var k = Math.min(1, (now - flight.t0)/flight.ms), e = k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3)/2;
    ctl.target.lerpVectors(flight.a.t, flight.b.t, e);
    // swing round the target rather than cutting through the building
    var A = flight.a.p.clone().sub(flight.a.t), B = flight.b.p.clone().sub(flight.b.t);
    var sa = new T.Spherical().setFromVector3(A), sb = new T.Spherical().setFromVector3(B), dt = sb.theta - sa.theta;
    if (dt > Math.PI) dt -= 2*Math.PI; if (dt < -Math.PI) dt += 2*Math.PI;
    var sp = new T.Spherical(sa.radius + (sb.radius - sa.radius)*e, sa.phi + (sb.phi - sa.phi)*e, sa.theta + dt*e);
    cam.position.copy(ctl.target).add(new T.Vector3().setFromSpherical(sp));
    cam.lookAt(ctl.target);
    if (k >= 1) flight = null;
  }
  ctl.addEventListener('start', function(){ flight = null; if (touring && !paused) pauseTour(); });

  /* ── tour: chapters with narration ── */
  var CH = CFG.tour, touring = false, paused = false, tStart = 0, tDur = 0, tLeft = 0, tIdx = 0, prog = card.querySelector('.xc-p i');
  var voiceOn = true, vo = new Audio(), voOk = {}, synth = window.speechSynthesis, ukVoice = null;
  vo.preload = 'auto';
  function pickVoice(){ if (!synth) return; var vs = synth.getVoices(); ukVoice = vs.filter(function(v){ return /^uk/i.test(v.lang); })[0] || null; }
  if (synth){ pickVoice(); if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice); }
  function readTime(i){ return Math.max(6000, CH[i].d.length*62); }
  function hush(){ try { vo.pause(); } catch(e){} if (synth) synth.cancel(); }
  function narrate(i, now){
    hush(); if (!voiceOn) return;
    var src = AUDIO + MODEL + '-' + i + '.mp3', delay = now ? 0 : 900;
    if (voOk[src] === false){ card.classList.add('nov'); return; }
    vo.src = src; vo.currentTime = 0;
    vo.onloadedmetadata = function(){ voOk[src] = true; card.classList.remove('nov'); if (touring && tIdx === i) retime(); };
    vo.onerror = function(){ voOk[src] = false; if (tIdx === i) card.classList.add('nov'); };   // no recording for this chapter yet: it runs on its reading timer
    var p = vo.play(); if (p && p.catch) p.catch(function(){});        // started inside the click: the browser lets later chapters play too
    if (delay){ vo.pause(); setTimeout(function(){ if (touring && tIdx === i && !paused && voiceOn) { var q = vo.play(); if (q && q.catch) q.catch(function(){}); } }, delay); }
  }
  function speak(i, delay){
    if (!synth || !ukVoice) return;                                     // no Ukrainian voice here: the chapter just runs on its timer
    setTimeout(function(){ if (!touring || tIdx !== i || paused || !voiceOn) return; var u = new SpeechSynthesisUtterance(CH[i].s || CH[i].d); u.voice = ukVoice; u.lang = ukVoice.lang; u.rate = .98; synth.speak(u); }, delay);
  }
  function retime(){
    var audio = voiceOn && vo.src && voOk[vo.src] && isFinite(vo.duration) && vo.duration > 0;
    tDur = audio ? (vo.duration + 1.6)*1000 + 900 : readTime(tIdx);
  }
  function tourStep(dir){
    tIdx += dir;
    if (tIdx >= CH.length){ stopTour(); closeCard(); api.reset(); return; }
    if (tIdx < 0) tIdx = 0;
    var c = CH[tIdx];
    var own = c.scene && SCENES[c.scene] && SCENES[c.scene].ownCam, ms = tIdx === 0 && dir > 0 ? 2600 : 2200;
    var prevS = tPrev != null && CH[tPrev] && CH[tPrev].scene ? SCENES[CH[tPrev].scene] : null;
    var go = function(){ if (!own) fly(chapterCam(c.cam), ms); else if (SCENES[c.scene]) SCENES[c.scene].play(0); };
    if (prevS && prevS.exit && prevS !== SCENES[c.scene]) prevS.exit(go); else go();
    tPrev = tIdx;
    fill(c, 'Екскурсія · розділ ' + (tIdx + 1), (tIdx + 1) + ' / ' + CH.length); card.classList.add('tour');
    var si = c.cam && c.cam.s != null ? c.cam.s : -1; spots.forEach(function(o, k){ o.b.classList.toggle('on', k === si); });
    paused = false; card.classList.remove('paused'); tStart = performance.now(); retime(); narrate(tIdx);
    if (c.scene && SCENES[c.scene] && !own) SCENES[c.scene].play(dir > 0 && tIdx === 0 ? 2300 : 1800);
    $next.textContent = tIdx === CH.length - 1 ? 'Завершити' : 'Далі →';
    Snd.duck(true);
  }
  var tPrev = null;
  function startTour(){ touring = true; bTour.setAttribute('aria-pressed', 'true'); tIdx = -1; tPrev = null; tourStep(1); }
  function pauseTour(){ paused = true; card.classList.add('paused'); tLeft = Math.max(0, tDur - (performance.now() - tStart)); try { vo.pause(); } catch(e){} if (synth) synth.pause(); }
  function resumeTour(){ paused = false; card.classList.remove('paused'); tStart = performance.now() - (tDur - tLeft);
    if (voiceOn && voOk[vo.src]){ var p = vo.play(); if (p && p.catch) p.catch(function(){}); } else if (synth) synth.resume(); }
  function stopTour(){ if (!touring) return; for (var k in SCENES) SCENES[k].reset(); touring = false; paused = false; hush(); card.classList.remove('paused', 'tour'); bTour.removeAttribute('aria-pressed'); prog.style.width = '0'; $next.textContent = 'Далі →'; Snd.duck(false); }
  bTour.addEventListener('click', function(){ if (touring){ stopTour(); closeCard(); } else startTour(); });
  function stepTour(now){
    if (!touring || paused) return;
    var k = (now - tStart)/tDur; prog.style.width = Math.max(0, Math.min(1, k))*100 + '%';
    if (k >= 1 && tIdx < CH.length - 1) tourStep(1);
    else if (k >= 1){ prog.style.width = '100%'; }                       // the last chapter waits on its links
  }

  /* ═══════════ WEATHER ═══════════ */
  var wPanel = el('div', 'xw'); wPanel.setAttribute('role', 'group'); wPanel.setAttribute('aria-label', 'Погода');
  WEATHER.forEach(function(w){ var b = el('button', null, w[1]); b.type = 'button'; b.dataset.w = w[0]; b.setAttribute('aria-pressed', String(w[0] === 'clear')); wPanel.appendChild(b); });
  document.body.appendChild(wPanel);
  bWeather.addEventListener('click', function(){ var o = !wPanel.classList.contains('open'); wPanel.classList.toggle('open', o); bWeather.setAttribute('aria-pressed', String(o || weather !== 'clear')); });
  wPanel.addEventListener('click', function(e){ var b = e.target.closest('[data-w]'); if (!b) return; setWeather(b.dataset.w); });
  addEventListener('keydown', function(e){ if (e.key === 'Escape'){ wPanel.classList.remove('open'); bWeather.setAttribute('aria-pressed', String(weather !== 'clear')); } });
  var overlay = el('div', 'xo'); api.renderer.domElement.insertAdjacentElement('afterend', overlay);

  /* ═══════════ SCENERY · trees and bushes in free ground round the building; foliage turns with the season;
     a tree that stands between the camera and the building fades so it never hides it ═══════════ */
  var trees = [], FOL = [];
  (function(){
    var groundM = null; scene.traverse(function(o){ if (!o.isMesh || !o.geometry || groundM || api.model.getObjectById(o.id)) return; var P = o.geometry.parameters || {};
      if ((o.geometry.type === 'PlaneGeometry' && P.width > 20) || (o.geometry.type === 'CircleGeometry' && P.radius > 10)) groundM = o; });
    if (!groundM) return;
    var GP = groundM.geometry.parameters, GR = GP.radius || GP.width/2, gc = new T.Vector3(groundM.position.x, 0, groundM.position.z);
    var rnd = (function(seed){ return function(){ seed = (seed*16807) % 2147483647; return (seed - 1)/2147483646; }; })(MODEL.length*7919 + 17);
    var dn = new T.Vector3(0, -1, 0), rc = new T.Raycaster(), targets = [api.model, groundM];
    function probe(x, z){ rc.set(new T.Vector3(x, 80, z), dn); rc.far = 120; var h = rc.intersectObjects(targets, true).filter(function(q){ return q.object.material && q.object.material.colorWrite !== false && q.object.visible; });
      if (!h.length) return null; var gy = null, occ = false; h.forEach(function(q){ if (q.object === groundM){ if (gy === null) gy = q.point.y; } else occ = true; }); return occ ? false : gy; }
    function free(x, z, r){ var y = probe(x, z); if (y == null || y === false) return null;
      for (var k = 0; k < 6; k++){ var a = k*Math.PI/3, q = probe(x + Math.cos(a)*r, z + Math.sin(a)*r); if (q === false || q == null) return null; } return y; }
    var bb = box.clone().expandByScalar(0), placed = [];
    function farFromOthers(x, z, d){ return placed.every(function(p){ return (p[0] - x)*(p[0] - x) + (p[1] - z)*(p[1] - z) > d*d; }); }
    function jitter(g, amt){ var a = g.attributes.position; for (var i = 0; i < a.count; i++){ var v = new T.Vector3().fromBufferAttribute(a, i), n = 1 + (Math.sin(v.x*3.1 + v.y*1.7) + Math.cos(v.z*2.3 - v.y*2.9))*amt; a.setXYZ(i, v.x*n, v.y*n, v.z*n); } g.computeVertexNormals(); return g; }
    var trunkM = new T.MeshStandardMaterial({color: '#4a3826', roughness: 1});
    var leafC = ['#4f6f33', '#5b7a38', '#46652e', '#62803c'], autumnC = ['#b8742a', '#c99a35', '#a5532a', '#d0a640'], conC = '#2e4a2f';
    function shade(g, lo, hi){ var a = g.attributes.position, c = new Float32Array(a.count*3); for (var i = 0; i < a.count; i++){ var y = a.getY(i), k = lo + (hi - lo)*Math.min(1, Math.max(0, (y + 1)/2)); k *= .92 + .16*Math.abs(Math.sin(a.getX(i)*7.3 + a.getZ(i)*5.1)); c[i*3] = c[i*3 + 1] = c[i*3 + 2] = k; } g.setAttribute('color', new T.BufferAttribute(c, 3)); return g; }
    var crownG = [shade(jitter(new T.IcosahedronGeometry(1, 2), .07), .55, 1.12), shade(jitter(new T.IcosahedronGeometry(1, 2), .1), .5, 1.1)];
    var coneG = shade(jitter(new T.ConeGeometry(1, 1, 12, 2), .05), .55, 1.1), trunkG = new T.CylinderGeometry(.14, .24, 1, 8);
    var home = cam.position.clone().sub(gc).setY(0).normalize();
    /* broadleaf species of a Polissia manor park: trunk height, crown blobs, blob size, spread, crown centre, vertical spread, squash, leaf colour */
    var SP = {
      dec:      {tr: 2.4, n: 9,  r: 1.05, o: 1.25, cy: 1.2, ys: 1.0, sy: .88},
      linden:   {tr: 2.6, n: 11, r: 1.15, o: 1.2,  cy: 1.7, ys: 1.25, sy: 1.0, c: 0},
      chestnut: {tr: 2.1, n: 12, r: 1.3,  o: 1.75, cy: 1.4, ys: .9,  sy: .82, c: 2},
      ash:      {tr: 3.0, n: 8,  r: .95,  o: 1.6,  cy: 1.5, ys: 1.1, sy: .8,  c: 3},
      poplar:   {tr: 1.8, n: 9,  r: .95,  o: .55,  cy: 3.0, ys: 2.6, sy: 1.25, c: 4},
      bush:     {tr: 0,   n: 4,  r: .5,   o: .45,  cy: .5,  ys: .25, sy: .88},
      shrub:    {tr: 0,   n: 3,  r: .55,  o: .25,  cy: .55, ys: .12, sy: .9, c: 1}
    };
    leafC.push('#7f9168'); autumnC.push('#d8c27a');                                   // white poplar: silvery leaves
    function tree(x, y, z, kind, s){
      var g = new T.Group(); g.position.set(x, y, z); g.rotation.y = rnd()*6.28; var mats = [];
      var sp = SP[kind] || SP.dec, trunkH = kind === 'con' ? 1.4*s : sp.tr*s, tr = new T.Mesh(trunkG, trunkM); tr.scale.set(s*(kind === 'chestnut' ? 1.3 : 1), Math.max(.01, trunkH), s*(kind === 'chestnut' ? 1.3 : 1)); tr.position.y = trunkH/2; g.add(tr);
      g.userData.ph = rnd()*6.28;
      if (kind === 'con'){
        var cm = new T.MeshStandardMaterial({color: conC, roughness: .95, vertexColors: true}); mats.push(cm);
        for (var k = 0; k < 4; k++){ var c = new T.Mesh(coneG, cm), w = (2.1 - k*.42)*s; c.scale.set(w, 2.6*s, w); c.position.y = trunkH + k*1.45*s + 1.1*s; g.add(c); }
      } else {
        var li = sp.c != null ? sp.c : (rnd()*4) | 0, lm = new T.MeshStandardMaterial({color: leafC[li], roughness: .9, vertexColors: true}); lm.userData.leaf = li; lm.userData.c0 = leafC[li]; lm.userData.c1 = autumnC[li]; mats.push(lm); FOL.push(lm);
        var top = sp.tr ? trunkH + sp.cy*s : sp.cy*s, crown = new T.Group(); crown.position.y = trunkH; g.add(crown); g.userData.crown = crown;
        for (var k2 = 0; k2 < sp.n; k2++){
          var b = new T.Mesh(crownG[k2 % 2], lm), r = sp.r*s*(.75 + rnd()*.5), a = rnd()*6.28, o = sp.o*s*(k2 ? .55 + rnd()*.6 : 0);
          var yy = top + (k2 ? (rnd()*2 - 1)*sp.ys*s*.8 : 0);
          b.scale.set(r, r*sp.sy, r); b.position.set(Math.cos(a)*o, yy - trunkH, Math.sin(a)*o); b.rotation.set(rnd()*3, rnd()*3, 0); crown.add(b); }
        if (!sp.tr) tr.visible = false;
      }
      mats.push(trunkM);
      g.traverse(function(m){ if (m.isMesh){ m.castShadow = true; m.receiveShadow = true; } });
      scene.add(g); trees.push({g: g, mats: mats.filter(function(m){ return m !== trunkM; }), kind: kind, x: x, z: z, fade: 0, low: !sp.tr && kind !== 'con', trunk: trunkM});
      placed.push([x, z]);
    }
    /* ── GROUNDS: each building gets its own setting, painted onto a skin over the turntable and planted deliberately:
       lawns, a dirt road and forecourt at the manor, cobbles round the churches, the baroque churchyard wall at the kostel ── */
    var RING = {kostel: 46, cerkva: 22.4, worobin: 18.5, mykolai: 18.5}[MODEL] || GR*.66;
    var CW = 2048, cvs = document.createElement('canvas'); cvs.width = cvs.height = CW;
    var K = cvs.getContext('2d'), PXM = CW/(2*GR);
    function X(x){ return (x - gc.x)*PXM + CW/2; } function Z(z){ return (z - gc.z)*PXM + CW/2; } function M(m){ return m*PXM; }
    function noise(col, n, rmin, rmax, a){ K.save(); K.fillStyle = col; for (var i = 0; i < n; i++){ K.globalAlpha = a*(.4 + rnd()*.6); K.beginPath(); K.arc(rnd()*CW, rnd()*CW, rmin + rnd()*(rmax - rmin), 0, 6.283); K.fill(); } K.restore(); }
    function lawn(){ K.fillStyle = '#56633a'; K.fillRect(0, 0, CW, CW); noise('#64723f', 900, 6, 30, .35); noise('#4b5733', 900, 6, 26, .35); noise('#77804a', 2500, 1, 3, .5); }
    function rrect(x0, z0, x1, z1, r){ var p = new Path2D(), a = X(x0), b = Z(z0), c = X(x1), d = Z(z1), rr = M(r); p.moveTo(a + rr, b); p.arcTo(c, b, c, d, rr); p.arcTo(c, d, a, d, rr); p.arcTo(a, d, a, b, rr); p.arcTo(a, b, c, b, rr); p.closePath(); return p; }
    function ell(x, z, rx, rz){ var p = new Path2D(); p.ellipse(X(x), Z(z), M(rx), M(rz), 0, 0, 6.283); return p; }
    function dirt(shape, base){                                                        // packed earth: a soft edge, ruts and pebbles
      K.save(); K.lineWidth = M(.8); K.strokeStyle = 'rgba(110,92,62,.45)'; K.stroke(shape); K.fillStyle = base || '#8b7553'; K.fill(shape); K.clip(shape);
      noise('#9b8562', 1600, 2, 9, .4); noise('#6f5c40', 1400, 2, 8, .35); noise('#b19c76', 2600, .8, 2, .6);
      K.restore();
    }
    var cobPat = null;
    function cobbles(shape){                                                           // field stones in rows: one tile, repeated
      if (!cobPat){
        var tc = document.createElement('canvas'), TS = 256; tc.width = tc.height = TS; var k = tc.getContext('2d');
        k.fillStyle = '#3d3830'; k.fillRect(0, 0, TS, TS);
        var st = Math.max(5, M(.19)), h = Math.max(4, M(.16)), row = 0;
        var rows = Math.round(TS/h); h = TS/rows; var cols = Math.round(TS/st); st = TS/cols;
        for (var y = 0; y < TS - .1; y += h, row++) for (var x = (row % 2)*st*.5; x < TS - .1 + (row % 2)*st*.5; x += st){
          var g = 112 + rnd()*40 | 0, w = st*(.72 + rnd()*.2), hh = h*(.7 + rnd()*.18);
          k.fillStyle = 'rgb(' + (g + 8) + ',' + (g + 2) + ',' + (g - 10) + ')'; var rot = (rnd() - .5)*.4;
          for (var ox = -TS; ox <= TS; ox += TS) for (var oy = -TS; oy <= TS; oy += TS){ k.beginPath(); k.ellipse(x + st/2 + ox, y + h/2 + oy, w/2, hh/2, rot, 0, 6.283); k.fill(); } }
        cobPat = K.createPattern(tc, 'repeat');
      }
      K.save(); K.fillStyle = cobPat; K.fill(shape); K.clip(shape); noise('#2f2b25', 160, 3, 12, .18); K.restore();
    }
    function edgeLine(shape, col, w){ K.save(); K.strokeStyle = col; K.lineWidth = M(w); K.stroke(shape); K.restore(); }
    function hedgeBed(x0, z0, x1, z1){                                                 // a flower bed edged with clipped box
      var p = rrect(x0, z0, x1, z1, .3); K.save(); K.fillStyle = '#5a4430'; K.fill(p); K.clip(p);
      ['#c9563f', '#e3c26a', '#efe6d4', '#b8506e', '#8a5fb0'].forEach(function(c){ K.fillStyle = c; for (var i = 0; i < 60; i++){ K.globalAlpha = .8; K.beginPath(); K.arc(X(x0 + .4 + rnd()*(x1 - x0 - .8)), Z(z0 + .4 + rnd()*(z1 - z0 - .8)), M(.07 + rnd()*.06), 0, 6.283); K.fill(); } });
      K.restore(); edgeLine(p, '#3f5a2c', .32);
    }
    /* the building's footprint: where a ray from above meets the model more than half a metre up (pavings and steps don't count) */
    var bx = (function(){ var b = new T.Box3(), v = new T.Vector3();           // the building's footprint: every vertex more than half a metre up
      api.model.updateMatrixWorld(true);
      api.model.traverse(function(o){ if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || (o.material && o.material.colorWrite === false)) return;
        var a = o.geometry.attributes.position, st = Math.max(1, Math.floor(a.count/6000));
        for (var i = 0; i < a.count; i += st){ v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); if (v.y > .6 && Math.hypot(v.x - gc.x, v.z - gc.z) < 30) b.expandByPoint(v.setY(0)); } });
      return b.isEmpty() ? box.clone() : b; })();
    var plantAt = [];                                                                   // [x, z, kind, scale]
    function plant(x, z, kind, sc){ plantAt.push([x, z, kind, sc]); }

    var LAY = {
      worobin: function(){
        lawn();
        /* the slope down to the Horyn: a meadow, longer and yellower grass */
        var mg = K.createLinearGradient(X(6), 0, X(16), 0); mg.addColorStop(0, 'rgba(120,124,70,0)'); mg.addColorStop(1, 'rgba(128,128,72,.55)'); K.fillStyle = mg; K.fillRect(X(6), 0, CW, CW);
        noise('#8a8a52', 1200, 1, 3, .45);
        /* the drive from the west, a forecourt before the steps, and the path the count takes south into the park */
        var road = new Path2D(); road.moveTo(X(-30), Z(-1.7)); road.lineTo(X(-19), Z(-1.9)); road.lineTo(X(-19), Z(1.9)); road.lineTo(X(-30), Z(1.7)); road.closePath();
        var court = ell(-18.2, 0, 3.0, 5.4);
        [road, court].forEach(function(p){ dirt(p); });
        var walk = new Path2D(); [[-17.2, 3], [-17.6, 5.5], [-17.9, 9], [-17.6, 14], [-17, 19]].forEach(function(q, i){ i ? walk.lineTo(X(q[0]), Z(q[1])) : walk.moveTo(X(q[0]), Z(q[1])); });
        K.save(); K.lineCap = K.lineJoin = 'round'; K.strokeStyle = 'rgba(110,92,62,.45)'; K.lineWidth = M(1.8); K.stroke(walk); K.strokeStyle = '#8b7553'; K.lineWidth = M(1.2); K.stroke(walk); K.restore();
        /* a path round the north side to the tower door, and down the slope east */
        var north = new Path2D(); [[-16, -3.5], [-12, -8], [-6, -14.5], [2, -15.2], [9, -12], [13, -6], [16, -2]].forEach(function(q, i){ i ? north.lineTo(X(q[0]), Z(q[1])) : north.moveTo(X(q[0]), Z(q[1])); });
        K.save(); K.lineCap = K.lineJoin = 'round'; K.strokeStyle = 'rgba(110,92,62,.4)'; K.lineWidth = M(1.5); K.stroke(north); K.strokeStyle = '#8f7a58'; K.lineWidth = M(1.0); K.stroke(north); K.restore();
        /* a parterre before the south colonnade: two box-edged beds either side of a gravel walk */
        var walkS = rrect(-1, 12.4, 1, 16.6, .2); K.fillStyle = '#a5946f'; K.fill(walkS); noise('#c2b38e', 0, 1, 1, 0);
        hedgeBed(-7, 13.2, -1.6, 16.2); hedgeBed(1.6, 13.2, 7, 16.2);
        /* a pond on the lower terrace, where the couple walks to */
        var pond = ell(12.6, 1.8, 3.2, 2.2); K.save(); K.fillStyle = 'rgba(70,82,52,.8)'; K.lineWidth = M(.7); K.strokeStyle = 'rgba(70,82,52,.8)'; K.stroke(pond);
        var pgr = K.createRadialGradient(X(12.2), Z(1.4), 0, X(12.6), Z(1.8), M(3.2)); pgr.addColorStop(0, '#5f7a7c'); pgr.addColorStop(.7, '#2f4a4c'); pgr.addColorStop(1, '#22352f');
        K.fillStyle = pgr; K.fill(pond); K.clip(pond); K.fillStyle = 'rgba(220,230,220,.25)'; for (var pi = 0; pi < 30; pi++){ K.fillRect(X(10 + Math.random()*5), Z(.5 + Math.random()*2.6), M(.5 + Math.random()*.8), M(.04)); } K.restore();
        K.fillStyle = '#4f6a34'; for (var ri = 0; ri < 120; ri++){ var ra = Math.random()*6.283, rr = 1 + Math.random()*.12; K.fillRect(X(12.6 + Math.cos(ra)*3.2*rr), Z(1.8 + Math.sin(ra)*2.2*rr), M(.06), M(.25)); }
        /* trees: lindens framing the forecourt, white poplars and spruces behind the tower, chestnuts and ash on the slope */
        plant(-20.5, -6.8, 'linden', 1.05); plant(-20.5, 6.8, 'linden', 1.0); plant(-15.2, -8.2, 'linden', .95);
        plant(-1.5, -16.2, 'con', 1.05); plant(-5.5, -15.8, 'con', .9); plant(-9.5, -13.6, 'con', 1.0);
        plant(5, -15.5, 'poplar', 1.1); plant(8.5, -14, 'poplar', 1.0); plant(11.5, -11.8, 'poplar', 1.15);
        plant(14.5, 4, 'ash', 1.0); plant(13, 10.5, 'chestnut', 1.0); plant(9.5, 14.2, 'chestnut', .9); plant(-11.5, 14.5, 'linden', .95);
        [[-9, 13.6], [9, 13.6], [-9, -10.2]].forEach(function(q){ plant(q[0], q[1], 'shrub', .8); });
        /* beyond the ring: the edge of the forest */
        return {outer: 12, outerKinds: ['con', 'linden', 'poplar', 'ash', 'con']};
      },
      kostel: function(){
        lawn();
        /* the churchyard as the old photographs show it: the wall runs well in front of the church, a few metres off its right
           side and far out to its left, where the yard held the old trees; the gate on the axis */
        var fz = bx.max.z + 7.5, bz = bx.min.z - 6, xl = bx.min.x - 22, xr = bx.max.x + 5.5;
        FENCE = {front: fz, back: bz, left: xl, right: xr};
        cobbles(rrect(-60, fz, 60, fz + 40, 0));                                         // the market square before the gate
        var round = rrect(bx.min.x - 1.6, bx.min.z - 1.6, bx.max.x + 1.6, bx.max.z + 1.6, 1.2);
        K.fillStyle = '#a2967c'; K.fill(round); K.save(); K.clip(round); noise('#b8ad94', 3000, .8, 2, .6); noise('#857a63', 2000, .8, 2, .5); K.restore();
        cobbles(rrect(-1.6, bx.max.z - .5, 1.6, fz, .1));                                // flagged walk from the gate to the door
        var side = new Path2D(); [[-2, fz - 2.5], [xl + 6, fz - 3.5], [xl + 7, bz + 6]].forEach(function(q, i){ i ? side.lineTo(X(q[0]), Z(q[1])) : side.moveTo(X(q[0]), Z(q[1])); });
        K.save(); K.lineCap = K.lineJoin = 'round'; K.strokeStyle = 'rgba(110,92,62,.4)'; K.lineWidth = M(1.6); K.stroke(side); K.strokeStyle = '#9a8a68'; K.lineWidth = M(1.1); K.stroke(side); K.restore();
        /* old chestnuts and limes: a grove in the wide left part of the yard, a row along the right wall */
        for (var gx = xl + 3.5; gx < bx.min.x - 4; gx += 6.2) for (var gz = fz - 5; gz > bz + 3; gz -= 7.4){ if (rnd() < .22) continue; plant(gx + (rnd() - .5)*2, gz + (rnd() - .5)*2, rnd() < .65 ? 'chestnut' : 'linden', 1.6 + rnd()*.5); }
        [fz - 4, fz - 15, bz + 8].forEach(function(z){ plant(xr - 2.6, z, 'chestnut', 1.7); });
        plant(bx.min.x + 4, bz + 2.6, 'linden', 1.6); plant(bx.max.x - 3, bz + 2.6, 'chestnut', 1.6);
        return {outer: 12, outerKinds: ['linden', 'chestnut', 'con', 'ash']};
      },
      cerkva: function(){
        lawn();
        /* as it is today: a wide paved square on the west and round the church, the lawn to the south with a few trees,
           a low railing along the street */
        var cx = (bx.min.x + bx.max.x)/2;
        var sq = new Path2D(); [[bx.min.x - 15, bx.min.z - 7], [bx.max.x + 5, bx.min.z - 7], [bx.max.x + 5, bx.max.z + 3.5], [bx.min.x + 4, bx.max.z + 3.5], [bx.min.x - 5, bx.max.z + 9.5], [bx.min.x - 15, bx.max.z + 9.5]]
          .forEach(function(q, i){ i ? sq.lineTo(X(q[0]), Z(q[1])) : sq.moveTo(X(q[0]), Z(q[1])); }); sq.closePath();
        cobbles(sq); edgeLine(sq, '#cfc6b2', .2);
        cobbles(rrect(bx.min.x - 40, -1.8, bx.min.x - 15, 1.8, 0));                       // the way in from the street
        var rx = bx.min.x - 15.6, rz = bx.max.z + 15;
        [[rx + 3.5, rz - 3], [rx + 10, rz - 2.8], [bx.max.x + 4, rz - 3.5], [bx.max.x + 7, bx.min.z - 9], [cx, bx.min.z - 10.5]].forEach(function(q, i){ plant(q[0], q[1], i === 4 ? 'con' : 'linden', 1.05 + rnd()*.25); });
        [[bx.min.x + 6, bx.max.z + 6.5], [cx + 4, bx.max.z + 7.5]].forEach(function(q){ plant(q[0], q[1], 'shrub', .8); });
        return {outer: 10, outerKinds: ['linden', 'con', 'chestnut', 'ash']};
      },
      mykolai: function(){
        lawn();
        /* as it is today: a lawn crossed by paved paths from the church to the corners of the yard, big trees all round */
        var cx = (bx.min.x + bx.max.x)/2, cz = (bx.min.z + bx.max.z)/2, w = bx.max.x - bx.min.x, d = bx.max.z - bx.min.z;
        var apron = rrect(bx.min.x - 1.6, bx.min.z - 1.6, bx.max.x + 1.6, bx.max.z + 1.6, 1.0);
        cobbles(apron); edgeLine(apron, '#cfc6b2', .16);
        function walk(x0, z0, x1, z1, wd){ var a = Math.atan2(z1 - z0, x1 - x0), L = Math.hypot(x1 - x0, z1 - z0); K.save(); K.translate(X(x0), Z(z0)); K.rotate(a);
          var p = new Path2D(); p.rect(0, -M(wd/2), M(L), M(wd)); cobbles(p); edgeLine(p, '#cfc6b2', .12); K.restore(); }
        var ex = w/2 + 13, ez = d/2 + 12;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(q){ walk(cx + q[0]*(w/2 - 1.5), cz + q[1]*(d/2 - 1.5), cx + q[0]*ex, cz + q[1]*ez, 2.2); });
        walk(bx.min.x - 1, cz, bx.min.x - 30, cz, 2.6);                                 // the main way in, to the west door
        for (var a = 0; a < Math.PI*2; a += Math.PI/8){ var rr = Math.max(w, d)/2 + 12.5 + rnd()*2.5, tx = cx + Math.cos(a)*rr, tz = cz + Math.sin(a)*rr*.92;
          if (Math.abs(Math.sin(a)) < .2 && Math.cos(a) < 0) continue;                    // keep the way in open
          if (Math.cos(a)*home.x + Math.sin(a)*home.z > .62) continue;                   // and the view from the front
          plant(tx, tz, rnd() < .25 ? 'con' : (rnd() < .5 ? 'chestnut' : 'linden'), 1.1 + rnd()*.25); }
        return {outer: 12, outerKinds: ['linden', 'con', 'chestnut', 'ash']};
      }
    };
    var FENCE = null, RAIL = null, lay = LAY[MODEL] ? LAY[MODEL]() : null;
    if (lay){
      /* fade the painted grounds out just inside the engraved ring */
      K.globalCompositeOperation = 'destination-in';
      var rg = K.createRadialGradient(CW/2, CW/2, M(RING - 3.2), CW/2, CW/2, M(RING - .4)); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      K.fillStyle = rg; K.fillRect(0, 0, CW, CW); K.globalCompositeOperation = 'source-over';
      var gt = new T.CanvasTexture(cvs); gt.encoding = T.sRGBEncoding; gt.anisotropy = 8;
      var gg = groundM.geometry.clone(); groundM.updateMatrixWorld(); gg.applyMatrix4(groundM.matrixWorld);
      var gp = gg.attributes.position, uv = new Float32Array(gp.count*2);
      for (var q = 0; q < gp.count; q++){ uv[q*2] = (gp.getX(q) - gc.x)/(2*GR) + .5; uv[q*2 + 1] = .5 - (gp.getZ(q) - gc.z)/(2*GR); gp.setY(q, gp.getY(q) + .012); }
      gg.setAttribute('uv', new T.BufferAttribute(uv, 2));
      var gmat = new T.MeshStandardMaterial({map: gt, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2});
      var skin = new T.Mesh(gg, gmat); skin.receiveShadow = true; skin.renderOrder = (groundM.renderOrder || 0) + 1; scene.add(skin);
      plantAt.forEach(function(t){ var y = probe(t[0], t[1]); if (y == null || y === false) return; tree(t[0], y, t[1], t[2], t[3]); });
      if (FENCE) churchyard(FENCE, probe);
      if (RAIL) railing(RAIL, probe);
      /* the forest beyond the ring, leaving the home view open */
      for (var i = 0, n = 0; i < 260 && n < lay.outer; i++){
        var a = rnd()*Math.PI*2, dir = new T.Vector3(Math.cos(a), 0, Math.sin(a)); if (dir.dot(home) > .5) continue;
        var r = GR*(.86 + rnd()*.1), x = gc.x + dir.x*r, z = gc.z + dir.z*r;
        if (!farFromOthers(x, z, 5)) continue; var y = free(x, z, 1.6); if (y == null) continue;
        tree(x, y, z, lay.outerKinds[n % lay.outerKinds.length], .95 + rnd()*.4); n++;
      }
    }

    /* a low iron railing on a stone kerb: posts every couple of metres, two rails, plain bars */
    function railing(lines, probe){
      var iron = new T.MeshStandardMaterial({color: '#23262a', roughness: .5, metalness: .6}), kerb = new T.MeshStandardMaterial({color: '#bdb6a6', roughness: .95});
      var bars = [], posts = [], G = new T.Group(); scene.add(G);
      lines = lines.map(function(l){                                                     // keep it inside the engraved ring
        var R = RING - 1.2, ax = l[0] - gc.x, az = l[1] - gc.z, dx = l[2] - l[0], dz = l[3] - l[1];
        var A = dx*dx + dz*dz, B = 2*(ax*dx + az*dz), C = ax*ax + az*az - R*R, D = B*B - 4*A*C; if (D <= 0) return null;
        var t0 = Math.max(0, (-B - Math.sqrt(D))/(2*A)), t1 = Math.min(1, (-B + Math.sqrt(D))/(2*A)); if (t1 - t0 < .05) return null;
        return [l[0] + dx*t0, l[1] + dz*t0, l[0] + dx*t1, l[1] + dz*t1]; }).filter(Boolean);
      lines.forEach(function(l){
        var dx = l[2] - l[0], dz = l[3] - l[1], L = Math.hypot(dx, dz), a = Math.atan2(-dz, dx), cx = (l[0] + l[2])/2, cz = (l[1] + l[3])/2, y = probe(cx, cz); if (y == null || y === false) y = 0;
        var g = new T.Group(); g.position.set(cx, y, cz); g.rotation.y = a; G.add(g);
        var kb = new T.Mesh(new T.BoxGeometry(L, .3, .32), kerb); kb.position.y = .15; kb.castShadow = kb.receiveShadow = true; g.add(kb);
        [.75, 1.45].forEach(function(h){ var r = new T.Mesh(new T.BoxGeometry(L, .04, .04), iron); r.position.y = h; g.add(r); });
        for (var t = -L/2; t <= L/2 + .01; t += .13) bars.push([g, t, .02]);
        for (t = -L/2; t <= L/2 + .01; t += 2.4) posts.push([g, t]);
      });
      var bg = new T.BoxGeometry(.022, 1.25, .022); bg.translate(0, .3 + .625, 0); var ib = new T.InstancedMesh(bg, iron, bars.length), m4 = new T.Matrix4(), w4 = new T.Matrix4();
      G.updateMatrixWorld(true);
      bars.forEach(function(b, i){ w4.makeTranslation(b[1], 0, 0); m4.multiplyMatrices(b[0].matrixWorld, w4); ib.setMatrixAt(i, m4); });
      ib.castShadow = true; scene.add(ib);
      posts.forEach(function(p){ var o = new T.Mesh(new T.BoxGeometry(.09, 1.65, .09), iron); o.position.set(p[1], .3 + .82, 0); o.castShadow = true; p[0].add(o);
        var c = new T.Mesh(new T.SphereGeometry(.07, 8, 6), iron); c.position.set(p[1], 1.98, 0); p[0].add(c); });
    }

    /* the kostel's churchyard wall, after the photographs: plastered piers with little pediments and tiled caps, wooden pickets
       on a low plinth between them; on the axis a baroque arched gate with a curved gable, flanked by two wicket gates */
    function churchyard(F, probe){
      var plaster = new T.MeshStandardMaterial({color: '#e8e1d1', roughness: .92}), tile = new T.MeshStandardMaterial({color: '#6a4535', roughness: .85}),
          wood = new T.MeshStandardMaterial({color: '#5d4c3b', roughness: .9}), plinthM = new T.MeshStandardMaterial({color: '#cfc5b1', roughness: .95});
      var Gf = new T.Group(); scene.add(Gf);
      function bxm(w, h, d, x, y, z, m, par){ var o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y + h/2, z); o.castShadow = o.receiveShadow = true; (par || Gf).add(o); return o; }
      function gable(w, h, d, x, y, z, rotY, m, par){                                     // a little pediment: triangular prism, face to the front
        var sh = new T.Shape([new T.Vector2(-w/2, 0), new T.Vector2(w/2, 0), new T.Vector2(0, h)]);
        var g = new T.ExtrudeGeometry(sh, {depth: d, bevelEnabled: false}); g.translate(0, 0, -d/2);
        var o = new T.Mesh(g, m); o.position.set(x, y, z); o.rotation.y = rotY || 0; o.castShadow = o.receiveShadow = true; (par || Gf).add(o); return o;
      }
      function pier(x, z, rotY, big){
        var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; Gf.add(g);
        var w = big ? .92 : .74, h = big ? 3.0 : 2.55;
        bxm(w + .14, .34, w + .14, 0, 0, 0, plaster, g); bxm(w, h - .34, w, 0, .34, 0, plaster, g);
        bxm(w + .04, .18, w + .04, 0, h - .55, 0, plaster, g);                              // a moulding under the cap
        bxm(w + .2, .14, w + .2, 0, h, 0, plaster, g);                                     // cornice
        gable(w + .2, .46, w + .26, 0, h + .14, 0, 0, plaster, g);                          // pediment facing front and back
        gable(w + .36, .5, w + .16, 0, h + .2, 0, 0, tile, g);                             // the tiled roof behind it, overhanging at the sides
        return g;
      }
      function pickets(x0, z0, x1, z1){                                                  // a panel of pointed pickets on a plinth between two piers
        var dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), a = Math.atan2(-dz, dx), cx = (x0 + x1)/2, cz = (z0 + z1)/2;
        var g = new T.Group(); g.position.set(cx, 0, cz); g.rotation.y = a; Gf.add(g);
        bxm(L, .55, .36, 0, 0, 0, plinthM, g); bxm(L, .06, .42, 0, .55, 0, plaster, g);
        bxm(L, .07, .05, 0, .95, 0, wood, g); bxm(L, .07, .05, 0, 1.85, 0, wood, g);
        var n = Math.floor(L/.15), pg = new T.BoxGeometry(.065, 1.62, .035); pg.translate(0, .81, 0);
        var tip = new T.ConeGeometry(.046, .14, 4); tip.rotateY(Math.PI/4); tip.translate(0, 1.69, 0);
        var im = new T.InstancedMesh(pg, wood, n), it = new T.InstancedMesh(tip, wood, n), m4 = new T.Matrix4();
        for (var i = 0; i < n; i++){ m4.makeTranslation(-L/2 + (i + .5)*L/n, .61, .03); im.setMatrixAt(i, m4); it.setMatrixAt(i, m4); }
        im.castShadow = it.castShadow = true; g.add(im); g.add(it);
      }
      var fz = F.front, bz = F.back;
      /* the gate group on the axis */
      var GG = new T.Group(); GG.position.set(0, 0, fz); Gf.add(GG);
      [-1, 1].forEach(function(s){ pier(s*1.95, fz, 0, true); pier(s*4.75, fz, 0, false); });
      (function(){                                                                        // the arch and its curved gable
        var w = 2.98, h = 3.75, sh = new T.Shape();
        sh.moveTo(-w/2, 0); sh.lineTo(w/2, 0); sh.lineTo(w/2, h);
        sh.bezierCurveTo(w/2 - .05, h + .55, .55, h + .55, .38, h + 1.15); sh.lineTo(-.38, h + 1.15); sh.bezierCurveTo(-.55, h + .55, -w/2 + .05, h + .55, -w/2, h); sh.lineTo(-w/2, 0);
        var hole = new T.Path(); hole.moveTo(-1.12, 0); hole.lineTo(1.12, 0); hole.lineTo(1.12, 2.3); hole.absarc(0, 2.3, 1.12, 0, Math.PI, false); hole.lineTo(-1.12, 0); sh.holes.push(hole);
        var g = new T.ExtrudeGeometry(sh, {depth: .62, bevelEnabled: false, curveSegments: 18}); g.translate(0, 0, -.31);
        var o = new T.Mesh(g, plaster); o.castShadow = o.receiveShadow = true; GG.add(o);
        var rib = new T.Shape(); rib.absarc(0, 2.3, 1.32, 0, Math.PI, false); rib.lineTo(-1.12, 2.3); rib.absarc(0, 2.3, 1.12, Math.PI, 0, true); rib.lineTo(1.32, 2.3);
        var rg2 = new T.ExtrudeGeometry(rib, {depth: .7, bevelEnabled: false, curveSegments: 18}); rg2.translate(0, 0, -.35); var ro = new T.Mesh(rg2, plaster); GG.add(ro);  // the archivolt
        bxm(.98, .14, .78, 0, h + 1.15, 0, plaster, GG); gable(1.0, .5, .84, 0, h + 1.29, 0, 0, plaster, GG); gable(1.16, .54, .74, 0, h + 1.35, 0, 0, tile, GG);
        [-1, 1].forEach(function(s){                                                     // the gate leaves: boards below, open pickets above
          var lf = new T.Group(); lf.position.set(s*1.1, 0, 0); GG.add(lf);
          bxm(1.08, 1.05, .06, -s*.54, .05, 0, wood, lf);
          for (var i = 0; i < 7; i++) bxm(.06, 1.35, .05, -s*(.08 + i*.155), 1.1, 0, wood, lf);
          bxm(1.08, .07, .07, -s*.54, 2.36, 0, wood, lf);
        });
      })();
      [-1, 1].forEach(function(s){                                                       // the wicket bays: a plastered wall with a small door
        var g = new T.Group(); g.position.set(s*3.35, 0, fz); Gf.add(g);
        var sh = new T.Shape(); sh.moveTo(-1.0, 0); sh.lineTo(1.0, 0); sh.lineTo(1.0, 2.35); sh.quadraticCurveTo(0, 2.0, -1.0, 2.35); sh.lineTo(-1.0, 0);
        var hl = new T.Path(); hl.moveTo(-.46, 0); hl.lineTo(.46, 0); hl.lineTo(.46, 1.85); hl.lineTo(-.46, 1.85); hl.lineTo(-.46, 0); sh.holes.push(hl);
        var eg = new T.ExtrudeGeometry(sh, {depth: .5, bevelEnabled: false}); eg.translate(0, 0, -.25); var w = new T.Mesh(eg, plaster); w.castShadow = w.receiveShadow = true; g.add(w);
        bxm(.9, .9, .05, 0, .02, -.06, wood, g); for (var i = 0; i < 5; i++) bxm(.05, .9, .04, -.36 + i*.18, .92, -.06, wood, g); bxm(.9, .06, .06, 0, 1.78, -.06, wood, g);
      });
      /* pickets and piers round the rest of the yard */
      function run(x0, z0, x1, z1, step){
        var L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L/step)), rot = Math.atan2(-(z1 - z0), x1 - x0);
        for (var i = 0; i < n; i++){ var a0 = i/n, a1 = (i + 1)/n;
          pickets(x0 + (x1 - x0)*a0, z0 + (z1 - z0)*a0, x0 + (x1 - x0)*a1, z0 + (z1 - z0)*a1);
          pier(x0 + (x1 - x0)*a1, z0 + (z1 - z0)*a1, rot, false); }
      }
      run(5.12, fz, F.right, fz, 3.6); run(F.right, fz, F.right, bz, 3.8);
      run(-5.12, fz, F.left, fz, 3.8); run(F.left, fz, F.left, bz, 3.8);
      run(F.left, bz, F.right, bz, 4);
      /* the piers stand on the ground, which is level here */
      var y0 = probe(0, fz + 2); if (y0 != null && y0 !== false) Gf.position.y = y0;
      Gf.traverse(function(o){ if (o.isMesh){ o.userData.fence = true; } });
      api.fence = Gf;
    }
    if (!lay){
    // outer grove beyond the engraved ring, leaving the home view open
    for (var i = 0, n = 0; i < 160 && n < 15; i++){
      var a = rnd()*Math.PI*2, dir = new T.Vector3(Math.cos(a), 0, Math.sin(a)); if (dir.dot(home) > .55) continue;
      var r = GR*(.87 + rnd()*.1), x = gc.x + dir.x*r, z = gc.z + dir.z*r;
      if (!farFromOthers(x, z, 5.5)) continue; var y = free(x, z, 2); if (y == null) continue;
      tree(x, y, z, rnd() < .35 ? 'con' : 'dec', .85 + rnd()*.45); n++;
    }
    // a few trees and bushes in free ground near the building
    var rIn = GR*.6;
    for (i = 0, n = 0; i < 400 && n < 7; i++){
      var x2 = gc.x + (rnd()*2 - 1)*rIn, z2 = gc.z + (rnd()*2 - 1)*rIn; if (Math.hypot(x2 - gc.x, z2 - gc.z) > rIn) continue;
      var dx = Math.max(bb.min.x - x2, 0, x2 - bb.max.x), dz = Math.max(bb.min.z - z2, 0, z2 - bb.max.z), d = Math.hypot(dx, dz);
      if (d < 2.5 || !farFromOthers(x2, z2, 4.5)) continue; var y2 = free(x2, z2, 2.2); if (y2 == null) continue;
      tree(x2, y2, z2, 'bush', .8 + rnd()*.5); n++;
    }
    for (i = 0, n = 0; i < 500 && n < 16; i++){
      var side = rnd()*4 | 0, t = rnd(), off = .9 + rnd()*1.6, x3, z3;
      if (side === 0){ x3 = bb.min.x + t*(bb.max.x - bb.min.x); z3 = bb.max.z + off; } else if (side === 1){ x3 = bb.min.x + t*(bb.max.x - bb.min.x); z3 = bb.min.z - off; }
      else if (side === 2){ z3 = bb.min.z + t*(bb.max.z - bb.min.z); x3 = bb.max.x + off; } else { z3 = bb.min.z + t*(bb.max.z - bb.min.z); x3 = bb.min.x - off; }
      if (!farFromOthers(x3, z3, 2.6)) continue; var y3 = free(x3, z3, .9); if (y3 == null) continue;
      tree(x3, y3, z3, 'bush', .55 + rnd()*.35); n++;
    }
    }
  })();
  function seasonTrees(w){ FOL.forEach(function(m){ m.color.set(w === 'autumn' ? m.userData.c1 : m.userData.c0); }); }
  var tv = new T.Vector3();
  function stepTrees(){
    if (!trees.length) return;
    var tt = performance.now()/1000;
    if (!reduced) trees.forEach(function(o){ var c = o.g.userData.crown; if (!c) return; var p = o.g.userData.ph; c.rotation.z = Math.sin(tt*.9 + p)*.018 + Math.sin(tt*2.3 + p*2)*.006; c.rotation.x = Math.cos(tt*.7 + p)*.012; });
    tv.copy(cam.position).sub(centre).setY(0); var cd = tv.length(); tv.normalize();
    trees.forEach(function(o){
      var dx = o.x - centre.x, dz = o.z - centre.z, dd = Math.hypot(dx, dz), dot = (dx*tv.x + dz*tv.z)/(dd || 1);
      var block = !o.low && dot > .5 && dd < cd ? Math.min(1, (dot - .5)*4) : 0;
      if (Math.abs(block - o.fade) < .01) return; o.fade += (block - o.fade)*.15;
      o.mats.forEach(function(m){ var on = o.fade > .02; if (m.transparent !== on){ m.transparent = on; m.depthWrite = !on; m.needsUpdate = true; } m.opacity = 1 - o.fade*.82; });
      o.g.children.forEach(function(ch){ if (ch.isMesh && ch.material === o.trunk) ch.visible = o.fade < .35; });
    });
  }

  /* ═══════════ WINDOWS · a room behind every pane ("interior mapping"): the view ray is traced into a box of plastered walls,
     floor and ceiling behind the glass, so the windows have depth instead of a flat dark fill ═══════════ */
  var ROOM = {kostel: ['vec3(0.86,0.78,0.62)', 'vec3(0.34,0.27,0.2)', 'vec3(1.0,0.78,0.42)', 0], cerkva: ['vec3(0.62,0.74,0.86)', 'vec3(0.32,0.26,0.2)', 'vec3(1.0,0.8,0.42)', 0],
    mykolai: ['vec3(0.5,0.62,0.82)', 'vec3(0.36,0.27,0.18)', 'vec3(1.0,0.78,0.4)', 0], worobin: ['vec3(0.82,0.74,0.6)', 'vec3(0.33,0.22,0.14)', 'vec3(1.0,0.86,0.6)', 1]}[MODEL];
  var UR = {uRoom: {value: .4}, uFire: {value: 0}, uFT: {value: 0}};
  function interior(sh){
    sh.uniforms.uRoom = UR.uRoom; sh.uniforms.uFire = UR.uFire; sh.uniforms.uFT = UR.uFT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 xWP;').replace('#include <project_vertex>', '#include <project_vertex>\nxWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 xWP; uniform float uRoom, uFire, uFT;')
      .replace('#include <emissivemap_fragment>', ['#include <emissivemap_fragment>',
        '{ vec3 D = normalize(xWP - cameraPosition), N = normalize((vec4(normal, 0.0)*viewMatrix).xyz); if (dot(N, D) > 0.0) N = -N;',
        '  vec3 Tg = cross(vec3(0.0, 1.0, 0.0), N); Tg = length(Tg) < .1 ? vec3(1.0, 0.0, 0.0) : normalize(Tg); vec3 Bg = cross(N, Tg);',
        '  vec3 rp = vec3(fract(dot(xWP, Tg)/4.2), fract((xWP.y + 0.6)/3.6), 0.0), rd = vec3(dot(D, Tg)/4.2, dot(D, Bg)/3.6, -dot(D, N)/5.0);',
        '  vec3 ex = (step(0.0, rd) - rp)/rd; float tz = (1.0 - rp.z)/rd.z, t = min(min(ex.x, ex.y), tz); vec3 h = rp + rd*t;',
        '  vec3 wall = ' + ROOM[0] + ', floorC = ' + ROOM[1] + ', glow = ' + ROOM[2] + ', c;',
        '  if (t == tz){ c = wall*(0.78 + 0.22*h.y);',
        (ROOM[3] ? '    float sh = fract(h.y*5.0), bk = fract(sin(floor(h.x*34.0) + floor(h.y*5.0)*7.1)*43758.5); vec3 spine = mix(vec3(0.42,0.16,0.1), vec3(0.18,0.26,0.16), step(.5, bk))*(0.7 + 0.5*fract(bk*7.3));' +
                     ' c = mix(c, spine, step(0.12, sh)*step(h.y, 0.86)*step(0.08, h.y)); c = mix(c, vec3(0.3,0.2,0.12), (1.0 - step(0.12, sh))*step(h.y, 0.9)); }' :
                     '    c += glow*0.55*exp(-pow((h.x - 0.5)*3.2, 2.0) - pow((h.y - 0.25)*3.0, 2.0)); c *= 0.9 + 0.1*step(0.5, fract(h.x*4.0)); }'),
        '  else if (t == ex.y) c = rd.y < 0.0 ? floorC*(0.8 + 0.2*step(0.5, fract(h.x*6.0 + floor(h.z*6.0)*0.5))) : wall*0.42;',
        '  else c = wall*0.62;',
        '  c *= mix(1.0, 0.42, h.z);',
        '  float fl = .75 + .25*sin(uFT*9.0 + xWP.x*1.7)*sin(uFT*5.3 + xWP.z*1.1 + xWP.y);',
        '  c = mix(c, vec3(1.0, .42, .1)*(1.3 + .9*h.y)*fl, uFire);',
        '  totalEmissiveRadiance += c*(uRoom + uFire*1.8)*(1.0 - 0.6*pow(1.0 - abs(dot(D, N)), 3.0)); }'].join('\n'));
  }

  /* ═══════════ SCENES · little stagings for tour chapters. Worobin: the west door opens, the count steps out onto the portico,
     raises his hat, and goes down the steps for a walk in the park ═══════════ */
  var SCENES = {};
  if (MODEL === 'worobin' && api.door) (function(){
    var D = api.door, M2 = function(c, o2){ return new T.MeshStandardMaterial(Object.assign({color: c, roughness: .8}, o2 || {})); };
    function mesh(g, m, x, y, z, par){ var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.renderOrder = 4; par.add(o); return o; }
    function grp(par, x, y, z){ var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); par.add(g); return g; }
    function taper(r0, r1, len, seg){ var g = new T.CylinderGeometry(r1, r0, len, seg || 10); g.translate(0, -len/2, 0); return g; }   // hangs down from its pivot
    function curve(K){                                                                // periodic Catmull–Rom through [phase 0…1, value] knots
      return function(u){
        u -= Math.floor(u); var n = K.length, i = 0; while (i < n - 1 && K[i + 1][0] <= u) i++;
        function at(k){ var m = ((k % n) + n) % n, wrap = Math.floor(k/n); return [K[m][0] + wrap, K[m][1]]; }
        var p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2), t = (u - p1[0])/(p2[0] - p1[0]);
        var t2 = t*t, t3 = t2*t;
        return .5*((2*p1[1]) + (-p0[1] + p2[1])*t + (2*p0[1] - 5*p1[1] + 4*p2[1] - p3[1])*t2 + (-p0[1] + 3*p1[1] - 3*p2[1] + p3[1])*t3);
      };
    }
    /* gait: joint angles over one stride (0 = heel strike), after the normal human walking curves, in degrees.
       hip + = thigh forward, knee + = bent, ankle + = toes up */
    var HIP = curve([[0, 26], [.12, 22], [.3, 6], [.5, -11], [.62, -6], [.75, 14], [.88, 27]]);
    var KNEE = curve([[0, 4], [.14, 16], [.38, 5], [.58, 34], [.72, 58], [.86, 26], [.96, 4]]);
    var ANK = curve([[0, 0], [.08, -6], [.42, 9], [.6, -16], [.7, -4], [.86, 2]]);
    var DEG = Math.PI/180;

    /* a person: the count in a frock coat and top hat, or a gardener or carter in shirt, waistcoat and cap */
    function figure(st){
      st = st || {};
      var coat = M2(st.coat || '#23262d'), trou = M2(st.trou || '#55555c'), white = M2('#efe9dc', {roughness: .6}), skin = M2('#d9b79c', {roughness: .7}),
          hatM = M2(st.hatC || '#16171b', {roughness: .45}), boot = M2('#141313', {roughness: .35}), hand = st.gloves === false ? skin : M2('#ece6d8', {roughness: .6}),
          caneM = M2('#3a2716', {roughness: .5}), gold = M2('#c9a24e', {roughness: .3, metalness: .7}), sleeve = st.sleeve ? M2(st.sleeve) : coat;
      var mats = [coat, trou, white, skin, hatM, boot, hand, caneM, gold, sleeve];
      /* rig: man (ground point, heading) → pelvis (height, sway, twist) → legs; torso on the pelvis, twisting against it */
      var man = new T.Group(); man.visible = false; scene.add(man);
      var pelvis = grp(man, 0, .95, 0), body = grp(pelvis, 0, -.95, 0);
      var prof = (st.short ? [[0, .86], [.17, .86], [.162, .96], [.158, 1.04], [.17, 1.2], [.2, 1.36], [.205, 1.42], [.16, 1.5], [.075, 1.54], [0, 1.54]]          // waistcoat to the hip
                           : [[0, .5], [.25, .5], [.215, .7], [.18, .92], [.158, 1.04], [.17, 1.2], [.2, 1.36], [.205, 1.42], [.16, 1.5], [.075, 1.54], [0, 1.54]])  // frock coat to the knee
        .map(function(q){ return new T.Vector2(q[0], q[1]); });
      mesh(new T.LatheGeometry(prof, 18), coat, 0, 0, 0, body).scale.z = .72;
      if (!st.short){ mesh(new T.BoxGeometry(.12, .2, .02), white, 0, 1.4, .135, body); mesh(new T.SphereGeometry(.045, 10, 8), white, 0, 1.49, .12, body).scale.set(1.3, .8, .6); }
      else mesh(new T.BoxGeometry(.2, .3, .02), white, 0, 1.25, .118, body);
      mesh(new T.CylinderGeometry(.052, .058, .12, 10), st.short ? skin : white, 0, 1.57, 0, body);
      var head = grp(body, 0, 1.62, 0);
      mesh(new T.SphereGeometry(.1, 16, 12), skin, 0, .09, .01, head).scale.set(.9, 1.12, .96);
      mesh(new T.SphereGeometry(.104, 14, 10, 0, Math.PI*2, 0, Math.PI*.55), M2(st.hair || '#5b4a3c'), 0, .1, -.008, head).scale.set(.92, 1.06, .98);
      var hat = grp(head, 0, .17, -.005); hat.rotation.x = -.06;
      if (st.hat === 'straw'){ mesh(new T.CylinderGeometry(.24, .24, .012, 22), hatM, 0, 0, 0, hat); mesh(new T.CylinderGeometry(.09, .1, .1, 16), hatM, 0, .05, 0, hat); }
      else if (st.hat === 'cap'){ mesh(new T.SphereGeometry(.11, 14, 8, 0, Math.PI*2, 0, Math.PI/2), hatM, 0, -.03, 0, hat).scale.set(1, .7, 1.05); mesh(new T.BoxGeometry(.16, .012, .1), hatM, 0, -.03, .1, hat); }
      else { mesh(new T.CylinderGeometry(.16, .16, .012, 22), hatM, 0, 0, 0, hat).scale.z = .86; mesh(new T.CylinderGeometry(.098, .088, .2, 18), hatM, 0, .105, 0, hat).scale.z = .88;
             mesh(new T.CylinderGeometry(.09, .09, .028, 18), M2('#3b2a1c'), 0, .02, 0, hat).scale.z = .89; }
      var L1 = .47, L2 = .43, SOLE = .065;
      var legs = [-1, 1].map(function(s){
        var hip = grp(pelvis, s*.095, 0, 0); mesh(taper(.078, .066, L1), trou, 0, 0, 0, hip);
        var knee = grp(hip, 0, -L1, 0); mesh(taper(.062, .05, L2), trou, 0, 0, 0, knee);
        var ank = grp(knee, 0, -L2, 0); mesh(new T.BoxGeometry(.09, .07, .25), boot, 0, -.035, .055, ank);
        return {hip: hip, knee: knee, ank: ank};
      });
      var arms = [-1, 1].map(function(s){
        var sh = grp(body, s*.215, 1.42, 0); sh.rotation.z = s*.08; mesh(taper(.06, .052, .3), sleeve, 0, 0, 0, sh);
        var el = grp(sh, 0, -.3, 0); el.rotation.x = -.15; mesh(taper(.05, .044, .27), sleeve, 0, 0, 0, el);
        mesh(new T.SphereGeometry(.046, 10, 8), hand, 0, -.3, .005, el);
        return {sh: sh, el: el};
      });
      var cane = null;
      if (st.cane){ cane = grp(arms[1].el, 0, -.3, .01); cane.rotation.x = -.5; mesh(new T.CylinderGeometry(.012, .011, .76, 6), caneM, 0, -.36, 0, cane); mesh(new T.SphereGeometry(.026, 10, 8), gold, 0, .02, 0, cane); }
      var F = {man: man, pelvis: pelvis, body: body, head: head, hat: hat, arms: arms, legs: legs, mats: mats, tool: null, cane: cane || null};
      F.lean = function(a){ body.rotation.x = a; body.position.set(0, -.95*Math.cos(a), -.95*Math.sin(a)); };   // bend forward at the hips, not at the feet
      if (st.rake){ var rk = grp(arms[1].el, 0, -.3, 0); F.tool = rk; mesh(new T.CylinderGeometry(.015, .015, 1.7, 6), caneM, 0, -.5, .2, rk).rotation.x = .5; mesh(new T.BoxGeometry(.45, .03, .04), caneM, 0, -1.25, .62, rk); }
      F.gait = function(ph, w){                                                         // ph: strides walked; w: 0 standing … 1 full stroll
        var drop = 0;
        legs.forEach(function(L, k){
          var u = ph + k*.5, h = HIP(u)*w*.85*DEG, kn = (KNEE(u)*w*.85 + 3)*DEG, a = ANK(u)*w*.8*DEG;
          L.hip.rotation.x = -h; L.knee.rotation.x = kn;
          drop = Math.max(drop, L1*Math.cos(h) + L2*Math.cos(h - kn));
          L.ank.rotation.x = (h - kn) - a;
        });
        var sw = Math.sin((ph + .02)*Math.PI*2)*w;
        arms[0].sh.rotation.x = -.34*sw; arms[0].el.rotation.x = -.18 - .22*Math.max(0, sw)*w;
        arms[1].sh.rotation.x = cane ? .06*sw - .05*w : .2*sw - .1*w; arms[1].el.rotation.x = cane ? -.42 : -.3 - .12*Math.max(0, -sw)*w;
        if (cane) cane.rotation.x = -.1 - arms[1].sh.rotation.x - arms[1].el.rotation.x;   // the cane hangs at the same slant whatever the arm does
        var c2 = Math.PI*2*ph;
        pelvis.position.y = drop + SOLE; pelvis.position.x = .022*w*Math.sin(c2 + .4);
        pelvis.rotation.y = .07*w*Math.sin(c2); pelvis.rotation.z = .025*w*Math.sin(c2 + Math.PI/2);
        body.rotation.y = -.1*w*Math.sin(c2); F.lean(.04*w);
        head.rotation.y = .05*w*Math.sin(c2); head.rotation.z = -.025*w*Math.sin(c2 + Math.PI/2);
      };
      F.fade = function(a){ mats.forEach(function(m){ m.opacity = a; var t = a < .999; if (m.transparent !== t) m.transparent = t; }); };
      return F;
    }
    var CF = figure({cane: true}), man = CF.man, pelvis = CF.pelvis, body = CF.body, head = CF.head, hat = CF.hat, arms = CF.arms, mats = CF.mats, gait = CF.gait;

    /* the route: out of the hall to the edge of the portico (a pause to greet), then a smooth path down the steps and into the park */
    var PX0 = -12.45, TR = .34, P = 1.5;
    function floorY(x){ if (x > -8.5) return D.floor; if (x >= PX0) return P + .1; if (x >= PX0 - 8*TR) return P*(9 - Math.ceil((PX0 - x)/TR))/9; return 0; }
    function groundAt(x){ var s = 0; for (var k = -3; k <= 3; k++) s += floorY(x + k*.07); return s/7; }   // the stair edges, softened over a foot's length
    var V3 = function(x, z){ return new T.Vector3(x, 0, z); }, st = D.pos(-D.depth + .7);
    var PA = new T.LineCurve3(V3(st.x, st.z), V3(-11.25, 0));
    var PB = new T.CatmullRomCurve3([V3(-11.25, 0), V3(-13.2, 0), V3(-15.6, .05), V3(-17, 1.2), V3(-17.8, 4.5), V3(-17.9, 9), V3(-17.5, 14)], false, 'centripetal');
    var LA = PA.getLength(), LB = PB.getLength();
    var V = 1.05, ACC = .7, STRIDE = 1.32, T_OPEN = 1.5, T_OUT = .7, PAUSE = 2.8;
    /* distance along a stretch of length len after t seconds: ease into the walk, stroll, ease to a halt */
    function trav(t, len, stop){
      var ta = ACC, da = V*ta/2;
      if (t <= 0) return 0;
      if (t < ta) return V*t*t/(2*ta);
      var cruise = stop ? len - 2*da : 1e9, tc = cruise/V;
      if (t < ta + tc) return da + V*(t - ta);
      if (!stop) return da + V*(t - ta);
      var td = t - ta - tc; if (td >= ta) return len;
      return da + cruise + V*td - V*td*td/(2*ta);
    }
    var tA = LA/V + ACC;                                                              // time to walk out (with easing at both ends)
    var run = null, yaw = 0, lastT = 0, ph = 0, lastD = 0;
    function ease(k){ k = Math.max(0, Math.min(1, k)); return k*k*(3 - 2*k); }
    function lift(k){                                                                  // raising the hat: left hand up to the brim and back
      var a = ease(Math.min(1, Math.max(0, k)/.35))*(1 - ease((Math.max(0, k) - .62)/.38));
      var h = ease((k - .22)/.2)*(1 - ease((k - .5)/.22));
      arms[0].sh.rotation.x = -2.5*a; arms[0].sh.rotation.z = -.08 - .3*a; arms[0].el.rotation.x = -.18 - 1.15*a;
      hat.position.y = .17 + .08*h; hat.position.z = -.005 + .05*h; hat.rotation.x = -.06 - .4*h;
      head.rotation.x = .14*h;                                                         // a little bow as the hat comes off
      CF.lean(.07*h);
    }
    function reset(){ run = null; man.visible = false; D.set(0); CF.fade(1); gait(0, 0); lift(0); ph = 0; lastD = 0; lastT = 0; }
    function play(delay){ reset(); run = {t0: performance.now() + (delay || 0)}; }
    function step(now){
      if (!run) return;
      var t = (now - run.t0)/1000; if (t < 0) return;
      var dt = Math.max(0, Math.min(.1, t - lastT)); lastT = t;
      /* the door: open, then shut behind him once he is out on the portico */
      var tShut = T_OUT + tA - .3;
      D.set(t < tShut ? ease(t/T_OPEN) : 1 - ease((t - tShut)/1.8));
      var tw = t - T_OUT; if (tw < 0) return;
      man.visible = true;
      var p, head0, d, greet = -1;
      if (tw < tA){ d = trav(tw, LA, true); p = PA.getPointAt(Math.min(1, d/LA)); head0 = Math.atan2(-1, 0); }
      else if (tw < tA + PAUSE){ d = LA; p = PA.getPointAt(1); head0 = Math.atan2(-1, 0); greet = (tw - tA)/PAUSE; }
      else {
        var db = trav(tw - tA - PAUSE, LB, false); if (db >= LB){ reset(); return; }
        d = LA + db; var u = db/LB; p = PB.getPointAt(u); var tg = PB.getTangentAt(Math.min(.999, u)); head0 = Math.atan2(tg.x, tg.z);
      }
      var spd = dt > 0 ? (d - lastD)/dt : 0, w = Math.min(1, spd/V); lastD = d;
      ph += (d - (run.d || 0))/STRIDE; run.d = d;
      /* heading: he turns towards the viewer while he greets, otherwise follows the path; a smooth, frame-rate-free turn */
      var hTo = head0;
      if (greet >= 0){ var tc = Math.atan2(cam.position.x - p.x, cam.position.z - p.z), dh = Math.atan2(Math.sin(tc - head0), Math.cos(tc - head0)); hTo = head0 + dh*.7*ease(greet/.2)*(1 - ease((greet - .8)/.2)); }
      yaw += Math.atan2(Math.sin(hTo - yaw), Math.cos(hTo - yaw))*(1 - Math.exp(-dt*6));
      if (!run.seen){ run.seen = true; yaw = hTo; }
      gait(ph, w);
      lift(greet >= 0 ? (greet - .15)/.7 : 0);
      man.position.set(p.x, groundAt(p.x), p.z); man.rotation.y = yaw;
      CF.fade(Math.min(1, (LA + LB - d)/2.4));
    }
    SCENES.count = {play: play, step: step, reset: reset, busy: function(){ return !!run; }};

    /* ── a horse: barrel, chest, rump, neck and head, four two-jointed legs; a four-beat walk ── */
    function ground(x){ var t1 = Math.max(0, Math.min(1, (x + 5)/14)), t2 = Math.max(0, Math.min(1, (x - 9.5)/12.5)); return -1.75*t1*t1*(3 - 2*t1) - 2.2*t2*t2*(3 - 2*t2); }
    function horse(col){                                                              // low-poly, in the same faceted style as the trees
      var o2 = {roughness: .65, flatShading: true};
      var hide = M2(col || '#5a3a24', o2), dark = M2('#241810', o2), hoofM = M2('#1a1714', o2), blaze = M2('#e8e0d0', o2);
      var mats = [hide, dark, hoofM, blaze];
      var g = new T.Group(), b = grp(g, 0, 0, 0);
      var barrel = mesh(new T.CylinderGeometry(.3, .32, 1.25, 10, 1).rotateX(Math.PI/2), hide, 0, 1.2, 0, b); barrel.scale.set(1, 1.18, 1);
      mesh(new T.SphereGeometry(1, 10, 8), hide, 0, 1.24, .62, b).scale.set(.3, .38, .3);         // chest
      mesh(new T.SphereGeometry(1, 10, 8), hide, 0, 1.27, -.6, b).scale.set(.32, .37, .32);        // quarters
      var neck = grp(b, 0, 1.42, .74); neck.rotation.x = .62;
      mesh(new T.CylinderGeometry(.1, .19, .78, 8).translate(0, .36, 0), hide, 0, 0, 0, neck); neck.children[0].scale.z = 1.25;
      mesh(new T.BoxGeometry(.05, .74, .1).translate(0, .38, -.14), dark, 0, 0, 0, neck);          // mane
      var head = grp(neck, 0, .74, .04); head.rotation.x = 1.25;
      mesh(new T.CylinderGeometry(.075, .12, .55, 8).translate(0, .22, 0), hide, 0, 0, 0, head);   // the long head, muzzle down
      mesh(new T.BoxGeometry(.03, .3, .02).translate(0, .26, .1), blaze, 0, 0, 0, head);
      [-1, 1].forEach(function(s){ mesh(new T.ConeGeometry(.03, .13, 5), hide, s*.055, -.02, -.07, head).rotation.x = -.6; });
      var tail = grp(b, 0, 1.36, -.9); tail.rotation.x = -.45; mesh(new T.CylinderGeometry(.05, .1, .75, 6).translate(0, -.37, 0), dark, 0, 0, 0, tail);
      var legs = [[-1, .52, .25], [1, .52, .75], [-1, -.55, 0], [1, -.55, .5]].map(function(q){
        var up = grp(b, q[0]*.17, 1.02, q[1]); mesh(taper(.085, .05, .52, 7), hide, 0, 0, 0, up);
        var lo = grp(up, 0, -.52, 0); mesh(taper(.04, .035, .42, 6), hide, 0, 0, 0, lo); mesh(new T.CylinderGeometry(.045, .055, .08, 7), hoofM, 0, -.46, .01, lo);
        return {up: up, lo: lo, o: q[2], front: q[1] > 0};
      });
      var wS = 0;
      return {g: g, mats: mats, walk: function(ph, w, t, dt){
        wS += (w - wS)*Math.min(1, (dt || .016)*4);                                    // ease in and out of the walk: no twitching
        legs.forEach(function(L){ var a = Math.PI*2*(ph + L.o); L.up.rotation.x = -.34*wS*Math.sin(a); L.lo.rotation.x = (L.front ? 1 : -1)*.62*wS*Math.max(0, Math.sin(a + .7)); });
        b.position.y = .025*wS*Math.sin(Math.PI*4*ph); neck.rotation.x = .62 + .05*wS*Math.sin(Math.PI*4*ph + 1) + (1 - wS)*.04*Math.sin((t || 0)*.7);
        head.rotation.x = 1.25 + (1 - wS)*.07*Math.sin((t || 0)*1.3); tail.rotation.z = .1*Math.sin((t || 0)*1.7);
      }};
    }
    function wheel(r, par, x, y, z, m){                                               // rim, hub and ten spokes in one mesh
      var parts = [new T.TorusGeometry(r, .035, 6, 28).rotateY(Math.PI/2), new T.CylinderGeometry(.07, .07, .14, 10).rotateZ(Math.PI/2)];
      for (var i = 0; i < 10; i++) parts.push(new T.BoxGeometry(.025, r*2, .025).rotateX(i*Math.PI/10));
      var P = [], N = [], cnt = 0; parts.forEach(function(g){ g = g.index ? g.toNonIndexed() : g; P.push(g.attributes.position.array); N.push(g.attributes.normal.array); cnt += g.attributes.position.array.length; });
      var pa = new Float32Array(cnt), na = new Float32Array(cnt), at = 0; P.forEach(function(a, i){ pa.set(a, at); na.set(N[i], at); at += a.length; });
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pa, 3)); geo.setAttribute('normal', new T.BufferAttribute(na, 3));
      var w = grp(par, x, y, z); mesh(geo, m, 0, 0, 0, w); return w; }
    function fadeMats(list, a){ list.forEach(function(m){ m.opacity = a; var t = a < .999; if (m.transparent !== t){ m.transparent = t; m.depthWrite = true; } }); }
    function follow(curve, L, d){ var u = Math.max(0, Math.min(1, d/L)), p = curve.getPointAt(u), tg = curve.getTangentAt(Math.min(.999, Math.max(.001, u))); return {p: p, h: Math.atan2(tg.x, tg.z)}; }

    /* ── chapter 2: a carriage comes up the drive and draws up at the steps — the new master, 1775 ── */
    (function(){
      var rig = new T.Group(); rig.visible = false; scene.add(rig);
      var paint = M2('#1d2a24', {roughness: .45}), trim = M2('#c9a24e', {roughness: .35, metalness: .6}), wood = M2('#5b3e24', {roughness: .7}), glassC = M2('#1a1f24', {roughness: .2}), leather = M2('#2a1a12', {roughness: .6});
      var cm = [paint, trim, wood, glassC, leather];
      var car = grp(rig, 0, 0, -1.2);
      mesh(new T.BoxGeometry(1.12, .95, 1.4), paint, 0, 1.38, 0, car); mesh(new T.BoxGeometry(1.2, .07, 1.5), paint, 0, 1.88, 0, car);
      mesh(new T.BoxGeometry(1.0, .12, 1.3), trim, 0, 1.96, 0, car).scale.y = .4;
      [-1, 1].forEach(function(s){ mesh(new T.BoxGeometry(.02, .36, .5), glassC, s*.565, 1.55, 0, car); mesh(new T.BoxGeometry(.02, .5, .02), trim, s*.567, 1.25, .26, car); mesh(new T.BoxGeometry(.02, .5, .02), trim, s*.567, 1.25, -.26, car);
        mesh(new T.BoxGeometry(.1, .14, .1), trim, s*.62, 1.7, .78, car); });
      mesh(new T.BoxGeometry(.9, .1, .5), wood, 0, 1.55, 1.0, car); mesh(new T.BoxGeometry(.9, .35, .06), leather, 0, 1.7, .78, car);   // the coachman's box
      mesh(new T.BoxGeometry(.06, .06, 2.0), wood, 0, .85, 1.75, car);                   // the pole
      var wheels = [[-.68, .58, -.6, .58], [.68, .58, -.6, .58], [-.66, .44, .62, .44], [.66, .44, .62, .44]].map(function(q){ return {w: wheel(q[3], car, q[0], q[1], q[2], wood), r: q[3]}; });
      var hs = [horse('#5a3a24'), horse('#4a2e1c')]; hs.forEach(function(h, i){ h.g.position.set(i ? .4 : -.4, 0, 2.05); rig.add(h.g); });
      var drv = figure({coat: '#2b2d35', trou: '#3a3a40', cane: false}); car.add(drv.man); drv.man.visible = true; drv.man.position.set(0, .62, 1.0);
      drv.legs.forEach(function(L){ L.hip.rotation.x = -1.45; L.knee.rotation.x = 1.4; }); drv.arms.forEach(function(A){ A.sh.rotation.x = -.7; A.el.rotation.x = -.6; });
      var allM = cm.concat(hs[0].mats, hs[1].mats, drv.mats);
      var V3 = function(x, z){ return new T.Vector3(x, 0, z); };
      var C = new T.CatmullRomCurve3([V3(-44, -1.3), V3(-30, -1.3), V3(-23.5, -1.8), V3(-20.2, -.4), V3(-19.2, 2.2)], false, 'centripetal'), L = C.getLength();
      var run = null, ph = 0, lastD = 0, TD = 14;
      function reset(){ run = null; rig.visible = false; }
      function play(delay){ reset(); run = {t0: performance.now() + (delay || 0)}; ph = 0; lastD = 0; }
      function step(now){
        if (!run) return; var t = (now - run.t0)/1000; if (t < 0) return;
        rig.visible = true;
        var k = Math.min(1, t/TD), d = L*(1 - Math.pow(1 - k, 2.2));                    // easing to a halt at the steps
        var f = follow(C, L, d); rig.position.set(f.p.x, ground(f.p.x), f.p.z); rig.rotation.y = f.h;
        var dt = Math.max(.001, t - (run.lt || 0)); run.lt = t;
        var dd = d - lastD; lastD = d; ph += dd/1.7; var w = Math.min(1, dd/dt/1.1);
        hs.forEach(function(h, i){ h.walk(ph + i*.13, w, t + i, dt); });
        wheels.forEach(function(W){ W.w.rotation.x += dd/W.r; });
        fadeMats(allM, Math.min(1, d/6));
      }
      SCENES.carriage = {play: play, step: step, reset: reset, busy: function(){ return !!run; }};
    })();

    /* ── chapter 3: an ordinary day — a hay cart comes slowly round the north side, a gardener sweeps the path ── */
    (function(){
      var rig = new T.Group(); rig.visible = false; scene.add(rig);
      var wood = M2('#6b4b2c', {roughness: .8, flatShading: true}), hay = M2('#c8a85a', {roughness: 1, flatShading: true});
      var cart = grp(rig, 0, 0, -1.55);
      mesh(new T.BoxGeometry(1.15, .28, 2.0), wood, 0, .78, 0, cart);
      [-1, 1].forEach(function(s){ mesh(new T.BoxGeometry(.04, .32, 2.0), wood, s*.58, 1.0, 0, cart); });
      var hm = mesh(new T.IcosahedronGeometry(1, 1), hay, 0, 1.22, 0, cart); hm.scale.set(.6, .42, 1.0);
      [-1, 1].forEach(function(s){ mesh(new T.BoxGeometry(.05, .05, 2.3), wood, s*.3, .9, 1.9, cart).rotation.x = -.08; });   // the shafts, up to the horse's sides
      var wheels = [-.66, .66].map(function(x){ return wheel(.55, cart, x, .55, 0, wood); });
      var hr = horse('#6a4a30'); hr.g.position.set(0, 0, 1.3); rig.add(hr.g);
      var carter = figure({coat: '#5a4a38', trou: '#4a4038', short: true, hat: 'straw', hatC: '#c9a86a', sleeve: '#e8e0cc', gloves: false, hair: '#3a2a1c'});
      var gard = figure({coat: '#3e4a3a', trou: '#544a3c', short: true, hat: 'cap', hatC: '#3a3530', sleeve: '#e8e0cc', gloves: false});
      /* the gardener's broom: a long handle held in both hands, a twig head on the path */
      var broom = new T.Group(); gard.body.add(broom);
      var bw = M2('#7a5a34', {roughness: .8}), tw = M2('#a08a5a', {roughness: 1, flatShading: true});
      mesh(new T.CylinderGeometry(.018, .018, 1.35, 6).translate(0, -.67, 0), bw, 0, 0, 0, broom);
      mesh(new T.ConeGeometry(.17, .4, 7).translate(0, -1.4, 0), tw, 0, 0, 0, broom);
      broom.position.set(.05, 1.12, .3);
      var allM = [wood, hay].concat(hr.mats);
      var V3 = function(x, z){ return new T.Vector3(x, 0, z); };
      var C = new T.CatmullRomCurve3([V3(-27, -14), V3(-16, -12.6), V3(-9, -14.2), V3(-2, -15.8), V3(5, -15), V3(10.5, -11.5), V3(14, -6), V3(18.5, -1.2), V3(26, 2.5)], false, 'centripetal'), L = C.getLength();
      var run = null, ph = 0, lastD = 0, SP = 1.05, GP = {x: -6.2, z: -12.2};
      function reset(){ run = null; rig.visible = false; carter.man.visible = false; gard.man.visible = false; }
      function play(delay){ reset(); run = {t0: performance.now() + (delay || 0), lt: 0}; ph = 0; lastD = 0; }
      function step(now){
        if (!run) return; var t = (now - run.t0)/1000; if (t < 0) return;
        var dt = Math.max(.001, t - run.lt); run.lt = t;
        var d = Math.min(L, t*SP);
        if (d >= L){ reset(); return; }
        rig.visible = carter.man.visible = gard.man.visible = true;
        var f = follow(C, L, d); rig.position.set(f.p.x, ground(f.p.x), f.p.z); rig.rotation.y = f.h;
        var dd = d - lastD; lastD = d; ph += dd/1.5;
        hr.walk(ph, 1, t, dt); wheels.forEach(function(W){ W.rotation.x += dd/.55; });
        /* the carter walks at the horse's head, on its left */
        var fc = follow(C, L, d + 1.5), side = new T.Vector3(Math.cos(fc.h), 0, -Math.sin(fc.h));
        var cx = fc.p.x - side.x*.85, cz = fc.p.z - side.z*.85;
        carter.man.position.set(cx, ground(cx), cz); carter.man.rotation.y = fc.h; carter.gait(d/1.25, 1);
        carter.arms[1].sh.rotation.x = -.55; carter.arms[1].el.rotation.x = -.5;            // a hand on the bridle
        var a = Math.min(1, d/5, (L - d)/5); fadeMats(allM, a); carter.fade(a); carter.mats.forEach(function(m){ m.transparent = a < .999; });
        /* the gardener sweeps: a slow swing of the broom, the body following it */
        var sw = Math.sin(t*1.5);
        gard.man.position.set(GP.x, ground(GP.x), GP.z); gard.man.rotation.y = .5;
        gard.gait(0, 0); gard.lean(.22); gard.body.rotation.y = .25*sw;
        gard.arms[0].sh.rotation.x = -.85; gard.arms[0].el.rotation.x = -.35; gard.arms[1].sh.rotation.x = -.55; gard.arms[1].el.rotation.x = -.55;
        broom.rotation.set(-.8, 0, .4*sw);
      }
      SCENES.life = {play: play, step: step, reset: reset, busy: function(){ return !!run; }};
    })();

    /* ── chapter 5: a couple strolls along the walk on the lower terrace, towards the pond ── */
    (function(){
      var him = figure({coat: '#3a3a44', trou: '#8a8478', hatC: '#7a746a', cane: false});
      /* her: a long skirt, a fitted jacket, a straw hat with a ribbon and a parasol */
      var her = figure({coat: '#6f5b74', trou: '#6f5b74', short: true, hat: 'straw', hatC: '#e6d6b0', sleeve: '#6f5b74', hair: '#4a3020'});
      var dress = M2('#8a7290', {roughness: .85}), lace = M2('#efe6d6', {roughness: .7}), para = M2('#efe2c8', {roughness: .8, side: T.DoubleSide});
      her.mats.push(dress, lace, para);
      var skirt = new T.Mesh(new T.LatheGeometry([[0, 0], [.42, 0], [.36, .3], [.27, .7], [.19, .98], [0, 1.0]].map(function(q){ return new T.Vector2(q[0], q[1]); }), 18), dress);
      skirt.castShadow = true; skirt.renderOrder = 4; her.man.add(skirt);
      her.legs.forEach(function(L){ L.hip.visible = false; });
      var pg = new T.Group(); her.body.add(pg); pg.position.set(-.24, 1.25, .05); pg.rotation.set(-.35, 0, .4);   // the parasol rests on her shoulder
      var stick = new T.Mesh(new T.CylinderGeometry(.01, .01, 1.0, 5).translate(0, .45, 0), lace); pg.add(stick);
      var canopy = new T.Mesh(new T.ConeGeometry(.55, .26, 10, 1, true).translate(0, 1.0, 0), para); canopy.castShadow = true; pg.add(canopy);
      var V3 = function(x, z){ return new T.Vector3(x, 0, z); };
      var C = new T.CatmullRomCurve3([V3(-9.5, 15.2), V3(-2, 16.4), V3(5, 15.4), V3(10, 12.4), V3(12, 8), V3(11.6, 4.6)], false, 'centripetal'), L = C.getLength();
      var run = null, SP = .85;
      function reset(){ run = null; him.man.visible = her.man.visible = false; }
      function play(delay){ reset(); run = {t0: performance.now() + (delay || 0)}; }
      function step(now){
        if (!run) return; var t = (now - run.t0)/1000; if (t < 0) return;
        var d = Math.min(L, t*SP); if (d >= L - .01){ d = L; }
        him.man.visible = her.man.visible = true;
        var w = d < L ? 1 : 0, f = follow(C, L, d), side = new T.Vector3(Math.cos(f.h), 0, -Math.sin(f.h));
        [[him, -.33], [her, .33]].forEach(function(q){ var x = f.p.x + side.x*q[1], z = f.p.z + side.z*q[1]; q[0].man.position.set(x, ground(x), z); q[0].man.rotation.y = f.h; q[0].gait(d/1.15 + (q[1] > 0 ? .5 : 0), w); });
        him.arms[1].sh.rotation.x = -.35; him.arms[1].el.rotation.x = -1.1; him.arms[1].sh.rotation.z = -.35;   // she takes his arm
        her.arms[0].sh.rotation.x = -.25; her.arms[0].el.rotation.x = -.9;
        her.arms[1].sh.rotation.x = -.5; her.arms[1].el.rotation.x = -1.5;                   // her hand up at the parasol's handle
        her.head.rotation.y = .25*Math.sin(t*.35); him.head.rotation.y = -.2 + .15*Math.sin(t*.3);
        var a = Math.min(1, d/3); him.fade(a); her.fade(a);
      }
      SCENES.couple = {play: play, step: step, reset: reset, busy: function(){ return !!run; }};
    })();

    /* ── chapter 7: the end — the light goes, the windows glow with fire, smoke climbs from the roof ── */
    (function(){
      var c = document.createElement('canvas'); c.width = c.height = 64; var k = c.getContext('2d'), g = k.createRadialGradient(32, 32, 0, 32, 32, 30);
      g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.5, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64);
      var tex = new T.CanvasTexture(c), N = 260, pos = new Float32Array(N*3), seed = [];
      for (var i = 0; i < N; i++) seed.push([Math.random()*16 - 8, Math.random()*16 - 8, Math.random()]);
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      var smokeM = new T.PointsMaterial({map: tex, size: 4.2, color: '#3a3430', transparent: true, depthWrite: false, opacity: 0});
      var smoke = new T.Points(geo, smokeM); smoke.frustumCulled = false; smoke.visible = false; smoke.renderOrder = 6; scene.add(smoke);
      var sp = new Float32Array(90*3), sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
      var sparkM = new T.PointsMaterial({map: tex, size: .5, color: '#ffb060', transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0});
      var sparks = new T.Points(sg, sparkM); sparks.frustumCulled = false; sparks.visible = false; scene.add(sparks);
      var glow = new T.PointLight('#ff7a2a', 0, 40, 1.6); glow.position.set(0, 4, 0); scene.add(glow);
      var run = null;
      var DUSK = {dir: [-.6, .12, .55], sunColor: '#c8603a', sunI: .35, fillColor: '#3a4470', fillI: .12, sky: '#3a3048', ground: '#120e0c', hemiI: .2, exposure: .62, env: .08, lamps: 0};
      function reset(){ run = null; smoke.visible = sparks.visible = false; UR.uFire.value = 0; glow.intensity = 0; if (api.light) api.light(null); }
      function play(delay){ reset(); run = {t0: performance.now() + (delay || 0)}; if (api.light) api.light(DUSK); }
      function step(now){
        if (!run) return; var t = (now - run.t0)/1000; if (t < 0) return;
        var k2 = Math.min(1, t/6), f = k2*k2*(3 - 2*k2);
        UR.uFire.value = f; glow.intensity = f*(2.2 + .8*Math.sin(t*7.3)*Math.sin(t*3.1));
        smoke.visible = sparks.visible = true; smokeM.opacity = .55*f; sparkM.opacity = .9*f;
        var top = (box.max.y - 3), P = geo.attributes.position.array;
        for (var i = 0; i < N; i++){ var s3 = seed[i], u = (s3[2] + t*.06) % 1; P[i*3] = s3[0]*(1 + u) + u*u*9; P[i*3 + 1] = top + u*22; P[i*3 + 2] = s3[1]*(1 + u) - u*4; }
        geo.attributes.position.needsUpdate = true;
        var Q = sg.attributes.position.array;
        for (i = 0; i < 90; i++){ var u2 = ((i*.137) + t*.3) % 1; Q[i*3] = Math.sin(i*12.9)*7 + u2*3; Q[i*3 + 1] = top - 2 + u2*12; Q[i*3 + 2] = Math.cos(i*7.7)*7; }
        sg.attributes.position.needsUpdate = true;
      }
      SCENES.fire = {play: play, step: step, reset: reset, exit: function(cb){ reset(); if (cb) cb(); }, busy: function(){ return !!run; }};
    })();

    /* ── chapter 4: through the open door into the library hall — the camera walks in and looks round ── */
    if (api.inside) (function(){
      var V = function(x, y, z){ return new T.Vector3(x, y, z); };
      var KEYS = [                                                                        // time, camera, look-at
        [3.2, V(-19.5, 3.3, 1.6), V(-8.5, 3.1, 0)],
        [6.4, V(-10.6, 3.05, 0), V(-6, 3.05, 0)],
        [8.6, V(-6.9, 3.1, .1), V(0, 3.3, -.4)],
        [13, V(-4.6, 3.4, 3.4), V(1, 3.0, -2.6)],
        [18.5, V(-1.4, 3.7, 4.6), V(.4, 7.0, -5)],
        [24, V(1.4, 3.3, -.6), V(7.2, 2.5, 4.3)]];
      var run = null, saved = null, exiting = null;
      function smooth(k){ return k*k*(3 - 2*k); }
      function sample(t, from){                                                        // position and target at time t along the keys (starting from wherever the camera was)
        var K = [[0, from.p, from.t]].concat(KEYS), i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
        var a = K[i], b = K[i + 1], k = smooth(Math.max(0, Math.min(1, (t - a[0])/(b[0] - a[0]))));
        return {p: a[1].clone().lerp(b[1], k), t: a[2].clone().lerp(b[2], k)};
      }
      function hold(){ if (!saved){ saved = {min: ctl.minDistance, max: ctl.maxDistance, fov: cam.fov}; ctl.minDistance = .05; ctl.maxDistance = 200; } }
      function release(){ if (saved){ ctl.minDistance = saved.min; ctl.maxDistance = saved.max; cam.fov = saved.fov; cam.updateProjectionMatrix(); saved = null; } }
      function play(delay){ hold(); flight = null; run = {t0: performance.now() + (delay || 0), from: {p: cam.position.clone(), t: ctl.target.clone()}}; }
      function lights(k){ api.inside.light(k); api.door.set(Math.min(1, k*1.6)); }
      function step(now){
        if (exiting){ var k = Math.min(1, (now - exiting.t0)/exiting.ms), e = smooth(k);
          cam.position.lerpVectors(exiting.a, exiting.b, e); ctl.target.lerpVectors(exiting.at, exiting.bt, e); cam.lookAt(ctl.target);
          lights(1 - e); if (saved) { cam.fov = saved.fov + (cam.fov - saved.fov)*(1 - e); cam.updateProjectionMatrix(); }
          if (k >= 1){ var cb = exiting.cb; exiting = null; lights(0); release(); if (cb) cb(); } return; }
        if (!run) return; var t = (now - run.t0)/1000; if (t < 0) return;
        if (touring && paused) { run.t0 += 16; return; }
        var s2 = sample(t, run.from); cam.position.copy(s2.p); ctl.target.copy(s2.t); cam.lookAt(ctl.target);
        lights(Math.max(0, Math.min(1, (t - 3.2)/3.6)));
        var fz = saved ? saved.fov : cam.fov, goal = t > 7 ? 56 : fz; cam.fov += (goal - cam.fov)*.04; cam.updateProjectionMatrix();
      }
      function exit(cb){
        if (!run && !saved){ if (cb) cb(); return; }
        run = null; exiting = {t0: performance.now(), ms: 2000, a: cam.position.clone(), at: ctl.target.clone(), b: V(-19.5, 3.3, 1.6), bt: V(-8.5, 3.1, 0), cb: cb};
      }
      function reset(){ run = null; exiting = null; lights(0); if (saved){ cam.position.set(-19.5, 3.3, 1.6); ctl.target.set(-8.5, 3.1, 0); } release(); }
      SCENES.library = {play: play, step: step, reset: reset, exit: exit, ownCam: true, busy: function(){ return !!run || !!exiting; }};
    })();
  })();
  function stepScenes(now){ for (var k in SCENES) SCENES[k].step(now); }

  /* snow on every upward-facing surface: one uniform shared by all the model's materials */
  var U = {uSnow: {value: 0}, uUpV: {value: new T.Vector3(0, 1, 0)}}, patched = [];
  scene.traverse(function(o){
    if (!o.isMesh) return; var m = o.material;
    if (!m || !m.isMeshStandardMaterial || patched.indexOf(m) >= 0 || m.userData.indoor) return; patched.push(m);
    var prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey;
    var glass = !m.map && ((m.color.r < .05 && m.color.g < .05 && m.color.b < .07 && m.roughness <= .2) || (m.color.r < .012 && m.color.g < .012 && m.color.b < .012));
    m.onBeforeCompile = function(sh, r){
      if (prev) prev.call(this, sh, r);
      sh.uniforms.uSnow = U.uSnow; sh.uniforms.uUpV = U.uUpV;
      if (glass) interior(sh);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSnow; uniform vec3 uUpV;')
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' +
          'float xsn = uSnow*smoothstep(0.42, 0.78, dot(normal, uUpV));\n' +
          'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 0.99), xsn);\n' +
          'roughnessFactor = mix(roughnessFactor, 0.85, xsn); metalnessFactor *= 1.0 - xsn;');
    };
    m.customProgramCacheKey = function(){ return (prevKey ? prevKey.call(this) : '') + '|xsnow' + (glass ? '|xroom' : ''); };
    m.needsUpdate = true;
  });

  function sprite(draw){ var c = document.createElement('canvas'); c.width = c.height = 64; draw(c.getContext('2d')); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; }
  var flake = sprite(function(k){ var g = k.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64); });
  var leaf = sprite(function(k){ k.translate(32, 32); k.rotate(.6); k.fillStyle = '#fff'; k.beginPath(); k.moveTo(0, -26); k.quadraticCurveTo(20, -4, 0, 26); k.quadraticCurveTo(-20, -4, 0, -26); k.fill(); k.strokeStyle = 'rgba(0,0,0,.35)'; k.lineWidth = 2; k.beginPath(); k.moveTo(0, -22); k.lineTo(0, 24); k.stroke(); });
  var R = Math.max(size.x, size.z)*.75 + 6, HH = size.y + 12;
  function cloud(n, mat, rnd){
    var g = new T.BufferGeometry(), pos = new Float32Array(n*3), sp = new Float32Array(n);
    for (var i = 0; i < n; i++){ var a = Math.random()*Math.PI*2, r = Math.sqrt(Math.random())*R; pos[i*3] = centre.x + Math.cos(a)*r; pos[i*3 + 1] = Math.random()*HH; pos[i*3 + 2] = centre.z + Math.sin(a)*r; sp[i] = Math.random(); }
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.userData.sp = sp;
    if (rnd) g.setAttribute('color', new T.BufferAttribute(rnd(n), 3));
    var p = new T.Points(g, mat); p.frustumCulled = false; p.renderOrder = 9; return p;
  }
  var FX = {};
  function makeFx(kind){
    if (FX[kind]) return FX[kind];
    var o;
    if (kind === 'snow') o = cloud(innerWidth < 700 ? 3000 : 6000, new T.PointsMaterial({size: .34, map: flake, transparent: true, depthWrite: false, opacity: .95, color: '#ffffff'}));
    if (kind === 'autumn') o = cloud(innerWidth < 700 ? 600 : 1100, new T.PointsMaterial({size: .62, map: leaf, transparent: true, depthWrite: false, alphaTest: .4, vertexColors: true}),
      function(n){ var c = new Float32Array(n*3), P = [[.85, .45, .1], [.78, .24, .08], [.92, .68, .18], [.6, .3, .1]]; for (var i = 0; i < n; i++){ var q = P[i % 4]; c[i*3] = q[0]; c[i*3 + 1] = q[1]; c[i*3 + 2] = q[2]; } return c; });
    if (kind === 'rain'){
      var n = innerWidth < 700 ? 1800 : 3400, g = new T.BufferGeometry(), pos = new Float32Array(n*6), sp = new Float32Array(n);
      for (var i = 0; i < n; i++){ var a = Math.random()*Math.PI*2, r = Math.sqrt(Math.random())*R, x = centre.x + Math.cos(a)*r, z = centre.z + Math.sin(a)*r, y = Math.random()*HH;
        pos.set([x, y, z, x + .05, y + .9, z + .02], i*6); sp[i] = .8 + Math.random()*.4; }
      g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.userData.sp = sp;
      o = new T.LineSegments(g, new T.LineBasicMaterial({color: '#b9c9dc', transparent: true, opacity: .42, depthWrite: false})); o.frustumCulled = false; o.renderOrder = 9;
    }
    if (o){ o.visible = false; scene.add(o); FX[kind] = o; }
    return o;
  }
  var weather = 'clear', snowTarget = 0, fog0 = scene.fog;
  var OVER = {clear: '', snow: 'radial-gradient(90% 70% at 50% 40%,rgba(200,214,236,.16),rgba(40,52,74,.42))', rain: 'radial-gradient(90% 70% at 50% 40%,rgba(30,40,56,.3),rgba(8,12,20,.6))',
    autumn: 'radial-gradient(80% 60% at 50% 60%,rgba(210,120,40,.18),rgba(40,22,8,.35))', fog: 'radial-gradient(90% 70% at 50% 45%,rgba(160,160,150,.42),rgba(70,70,66,.6))'};
  function setWeather(w){
    weather = w;
    wPanel.querySelectorAll('[data-w]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.w === w)); });
    bWeather.setAttribute('aria-pressed', String(w !== 'clear' || wPanel.classList.contains('open')));
    ['snow', 'rain', 'autumn'].forEach(function(k){ var f = w === k ? makeFx(k) : FX[k]; if (f) f.visible = w === k; });
    snowTarget = w === 'snow' ? 1 : 0;
    scene.fog = w === 'fog' ? new T.FogExp2('#77766f', .028) : w === 'rain' ? new T.FogExp2('#3c4450', .012) : fog0;
    overlay.style.background = OVER[w] || 'none'; overlay.style.opacity = w === 'clear' ? 0 : 1;
    Snd.weather(w); seasonTrees(w);
  }
  var lastT = 0;
  function stepFx(now){
    var dt = Math.min(.05, lastT ? (now - lastT)/1000 : 0); lastT = now;
    U.uSnow.value += (snowTarget - U.uSnow.value)*Math.min(1, dt*1.2);
    UR.uFT.value = now/1000;
    U.uUpV.value.set(0, 1, 0).transformDirection(cam.matrixWorldInverse);
    var t = now/1000;
    if (FX.snow && FX.snow.visible){ var a = FX.snow.geometry.attributes.position, sp = FX.snow.geometry.userData.sp, A = a.array;
      for (var i = 0; i < a.count; i++){ var j = i*3; A[j + 1] -= dt*(.9 + sp[i]*.8); A[j] += Math.sin(t*.7 + sp[i]*40)*dt*.35; A[j + 2] += Math.cos(t*.5 + sp[i]*30)*dt*.3; if (A[j + 1] < 0) A[j + 1] += HH; }
      a.needsUpdate = true; }
    if (FX.autumn && FX.autumn.visible){ var b = FX.autumn.geometry.attributes.position, s2 = FX.autumn.geometry.userData.sp, B = b.array;
      for (i = 0; i < b.count; i++){ j = i*3; B[j + 1] -= dt*(.55 + s2[i]*.5); B[j] += (Math.sin(t*1.3 + s2[i]*50)*1.2 + .6)*dt; B[j + 2] += Math.cos(t*1.1 + s2[i]*20)*dt*.8;
        if (B[j + 1] < 0){ B[j + 1] += HH; B[j] -= R*.4; } }
      FX.autumn.material.size = .58 + Math.sin(t*3)*.06; b.needsUpdate = true; }
    if (FX.rain && FX.rain.visible){ var c = FX.rain.geometry.attributes.position, s3 = FX.rain.geometry.userData.sp, C = c.array;
      for (i = 0; i < s3.length; i++){ j = i*6; var dy = dt*22*s3[i]; C[j + 1] -= dy; C[j + 4] -= dy; C[j] -= dy*.05; C[j + 3] -= dy*.05; if (C[j + 1] < 0){ C[j + 1] += HH; C[j + 4] += HH; } }
      c.needsUpdate = true; }
  }

  /* ═══════════ SOUND (Web Audio, all synthesised) ═══════════ */
  var Snd = (function(){
    var ctx = null, master, verb, on = false, ducked = false, timers = [], amb = {}, kind = CFG.sound;
    function mk(){
      if (ctx) return; var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      verb = ctx.createConvolver(); var L = ctx.sampleRate*3.2, ir = ctx.createBuffer(2, L, ctx.sampleRate);
      for (var c = 0; c < 2; c++){ var d = ir.getChannelData(c); for (var i = 0; i < L; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/L, 3.2); }
      verb.buffer = ir; var vg = ctx.createGain(); vg.gain.value = .55; verb.connect(vg); vg.connect(master);
    }
    function out(g, wet){ g.connect(master); if (wet) { var w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(verb); } }
    function noiseBuf(sec, brown){ var L = ctx.sampleRate*sec, b = ctx.createBuffer(1, L, ctx.sampleRate), d = b.getChannelData(0), last = 0;
      for (var i = 0; i < L; i++){ var w = Math.random()*2 - 1; if (brown){ last = (last + .02*w)/1.02; d[i] = last*3.5; } else d[i] = w; } return b; }
    /* a cast bell: hum, prime, minor third, fifth, nominal and upper partials, each dying at its own rate, plus the clapper's knock */
    function bell(f, t, vol, len){
      var P = [[.5, .9, 1], [1, .7, .72], [1.19, .5, .5], [1.5, .3, .38], [2, .45, .32], [2.51, .22, .22], [2.66, .15, .2], [3.01, .14, .16], [4.16, .08, .1], [5.4, .05, .07]];
      var g = ctx.createGain(); g.gain.value = vol; var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan){ pan.pan.value = (Math.random() - .5)*.6; g.connect(pan); out(pan, .7); } else out(g, .7);
      P.forEach(function(p){ var o = ctx.createOscillator(), a = ctx.createGain(); o.type = 'sine'; o.frequency.value = f*p[0]*(1 + (Math.random() - .5)*.003);
        a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(p[1], t + .004); a.gain.exponentialRampToValueAtTime(.0001, t + len*p[2]);
        o.connect(a); a.connect(g); o.start(t); o.stop(t + len*p[2] + .05); });
      var n = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), na = ctx.createGain(); n.buffer = noiseBuf(.08); bp.type = 'bandpass'; bp.frequency.value = f*3; bp.Q.value = 4;
      na.gain.setValueAtTime(.35, t); na.gain.exponentialRampToValueAtTime(.001, t + .06); n.connect(bp); bp.connect(na); na.connect(g); n.start(t);
    }
    /* «трезвін»: великий дзвін на сильну долю, середні між ними, малі — дрібним перебором */
    function peal(t0, bars){
      var big = 98, mid = [196, 220], small = [523.3, 587.3, 659.3, 784];
      for (var b = 0; b < bars; b++){ var t = t0 + b*2.4;
        bell(big, t, .5, 7);
        bell(mid[b % 2], t + 1.2, .22, 4);
        for (var k = 0; k < 8; k++) bell(small[(k + b) % 4]*(k % 3 === 2 ? 1.0 : 1), t + .3*k, .07, 1.6); }
    }
    function toll(n){ var t = ctx.currentTime + .05; for (var i = 0; i < n; i++) bell(kind === 'organ' ? 147 : 98, t + i*2.2, .45, 6); }
    /* organ: pipe ranks as stacked harmonics, slow chords in D major */
    function organ(){
      var CH = [[50, 57, 62, 65], [55, 58, 62, 67], [57, 61, 64, 69], [50, 57, 62, 65], [46, 58, 62, 65], [55, 58, 62, 67], [57, 61, 64, 69], [50, 57, 62, 65]], dur = 4.2;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; var g = ctx.createGain(); g.gain.value = .085; lp.connect(g); out(g, .9);
      function chord(i, t){ CH[i % CH.length].forEach(function(m){ var f = 440*Math.pow(2, (m - 69)/12);
        [[1, 1], [2, .5], [3, .22], [4, .16], [6, .07], [8, .05]].forEach(function(h){ var o = ctx.createOscillator(), a = ctx.createGain(); o.type = h[0] === 1 ? 'triangle' : 'sine'; o.frequency.value = f*h[0];
          a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(h[1]*.25, t + .35); a.gain.setValueAtTime(h[1]*.25, t + dur - .2); a.gain.linearRampToValueAtTime(0, t + dur + .9);
          o.connect(a); a.connect(lp); o.start(t); o.stop(t + dur + 1); }); }); }
      var i = 0, next = ctx.currentTime + .1;
      (function loop(){ if (!on) return; while (next < ctx.currentTime + 1.5){ chord(i++, next); next += dur; } timers.push(setTimeout(loop, 600)); })();
    }
    /* the organ, full: principals 16'–8'–4'–2' and a mixture, as stacked harmonics, through a long church reverb */
    var hall = null;
    function hallVerb(){
      if (hall) return hall; hall = ctx.createConvolver(); var L = ctx.sampleRate*5.5, ir = ctx.createBuffer(2, L, ctx.sampleRate);
      for (var c = 0; c < 2; c++){ var d = ir.getChannelData(c); for (var i = 0; i < L; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/L, 2.6)*(i < 400 ? i/400 : 1); }
      hall.buffer = ir; var g = ctx.createGain(); g.gain.value = .9; hall.connect(g); g.connect(master); return hall;
    }
    function pipe(m, t, dur, vol, bus){
      var f = 440*Math.pow(2, (m - 69)/12), H = m < 45 ? [[.5, .5], [1, 1], [2, .5], [3, .25], [4, .16]] : [[.5, .22], [1, 1], [2, .62], [3, .3], [4, .3], [6, .14], [8, .12], [12, .06]];
      H.forEach(function(h){ if (f*h[0] > 9000) return; var o = ctx.createOscillator(), a = ctx.createGain(); o.type = 'sine'; o.frequency.value = f*h[0]*(1 + (Math.random() - .5)*.0016);
        a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(h[1]*vol, t + .025); a.gain.setValueAtTime(h[1]*vol, t + dur); a.gain.linearRampToValueAtTime(0, t + dur + .14);
        o.connect(a); a.connect(bus); o.start(t); o.stop(t + dur + .2); });
    }
    /* Й. С. Бах, Токата ре мінор, BWV 565 — вступ (твір у суспільному надбанні; звучання синтезоване тут же) */
    function toccata(t0){
      var bus = ctx.createGain(); bus.gain.value = .5; var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500; bus.connect(lp);
      var dry = ctx.createGain(); dry.gain.value = .55; lp.connect(dry); dry.connect(master); var wet = ctx.createGain(); wet.gain.value = .75; lp.connect(wet); wet.connect(hallVerb());
      var t = t0, V = .05;
      function N(ms, dur, gap, oct){ ms.forEach(function(m){ pipe(m, t, dur, V, bus); if (oct) pipe(m - 12, t, dur, V*.8, bus); }); t += dur + (gap || 0); }
      [0, -12, -24].forEach(function(sh, k){
        var hold = 1.3 + k*.35;
        N([69 + sh], .11, 0, true); N([67 + sh], .11, 0, true); N([69 + sh], hold, .45, true);
        N([67 + sh], .12, 0, true); N([65 + sh], .12, 0, true); N([64 + sh], .12, 0, true); N([62 + sh], .12, 0, true);
        N([61 + sh], .75, 0, true); N([62 + sh], 1.5 + k*.4, .55, true);
      });
      var pedal = t; pipe(38, pedal, 7.6, V*1.3, bus); pipe(26, pedal, 7.6, V*1.1, bus);
      [49, 52, 55, 58, 61, 64, 67, 70].forEach(function(m, i){ pipe(m, t + i*.085, 2.8 - i*.085, V*.85, bus); });
      t += 2.9;
      [50, 53, 57, 62, 65, 69, 74].forEach(function(m, i){ pipe(m, t + i*.03, 4.6, V*.85, bus); });
      return t + 4.9 - ctx.currentTime;
    }
    function chirp(){
      if (!on) return; var t = ctx.currentTime + .02, base = 2600 + Math.random()*1800, n = 2 + (Math.random()*4 | 0), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null, g = ctx.createGain(); g.gain.value = .05 + Math.random()*.04;
      if (pan){ pan.pan.value = Math.random()*1.6 - .8; g.connect(pan); out(pan, .35); } else out(g, .35);
      for (var i = 0; i < n; i++){ var o = ctx.createOscillator(), a = ctx.createGain(), s = t + i*(.09 + Math.random()*.05);
        o.frequency.setValueAtTime(base, s); o.frequency.exponentialRampToValueAtTime(base*(1.25 + Math.random()*.4), s + .06); o.frequency.exponentialRampToValueAtTime(base*.9, s + .1);
        a.gain.setValueAtTime(0, s); a.gain.linearRampToValueAtTime(1, s + .01); a.gain.exponentialRampToValueAtTime(.001, s + .11); o.connect(a); a.connect(g); o.start(s); o.stop(s + .13); }
      timers.push(setTimeout(chirp, 1200 + Math.random()*4200));
    }
    function loopNoise(name, brown, filt, f, q, vol, lfo){
      if (amb[name]) return; var s = ctx.createBufferSource(); s.buffer = noiseBuf(4, brown); s.loop = true;
      var b = ctx.createBiquadFilter(); b.type = filt; b.frequency.value = f; b.Q.value = q || .7; var g = ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2);
      s.connect(b); b.connect(g); out(g, .15);
      if (lfo){ var o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = .07 + Math.random()*.05; og.gain.value = vol*.6; o.connect(og); og.connect(g.gain); o.start(); amb[name + 'L'] = o; }
      s.start(); amb[name] = {s: s, g: g};
    }
    function stopNoise(name){ var a = amb[name]; if (!a) return; a.g.gain.cancelScheduledValues(ctx.currentTime); a.g.gain.setValueAtTime(a.g.gain.value, ctx.currentTime); a.g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      a.s.stop(ctx.currentTime + 1.6); if (amb[name + 'L']) { amb[name + 'L'].stop(ctx.currentTime + 1.6); delete amb[name + 'L']; } delete amb[name]; }
    var w = 'clear';
    function weatherSnd(){
      if (!on) return;
      if (w === 'rain') loopNoise('rain', false, 'highpass', 900, .5, .07); else stopNoise('rain');
      if (w === 'snow' || w === 'autumn' || w === 'fog' || kind === 'nature') loopNoise('wind', true, 'lowpass', 420, .8, w === 'clear' ? .05 : .09, true); else stopNoise('wind');
    }
    return {
      toggle: function(){
        mk(); if (!ctx) return false; on = !on;
        if (ctx.state === 'suspended') ctx.resume();
        master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(on ? (ducked ? .3 : .8) : 0, ctx.currentTime + (on ? .6 : .8));
        if (on){
          if (kind === 'bells') peal(ctx.currentTime + .2, 5);
          if (kind === 'organ'){ toll(2); var len = toccata(ctx.currentTime + 4.6); timers.push(setTimeout(organ, (len + 1.5)*1000)); }
          if (w !== 'rain' && w !== 'snow' && kind !== 'organ') timers.push(setTimeout(chirp, kind === 'nature' ? 300 : 9000));
          weatherSnd();
        } else { timers.forEach(clearTimeout); timers = []; Object.keys(amb).forEach(function(k){ if (amb[k].s) stopNoise(k); }); }
        return on;
      },
      weather: function(x){ w = x; if (ctx && on) weatherSnd(); },
      duck: function(d){ ducked = d; if (!ctx || !on) return; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime); master.gain.linearRampToValueAtTime(d ? .3 : .8, ctx.currentTime + .8); },
      hour: function(h){ if (!on || kind === 'nature') return; toll(h % 12 === 0 ? 3 : 1); },
      on: function(){ return on; }
    };
  })();
  bSound.addEventListener('click', function(){ bSound.setAttribute('aria-pressed', String(Snd.toggle())); });
  /* the sun panel's clock: a toll when the hour turns (churches only) */
  var sunOut = null, lastH = null, lastToll = 0;
  setTimeout(function(){ sunOut = document.getElementById('sunOut'); if (!sunOut || !window.MutationObserver) return;
    new MutationObserver(function(){ var m = /^(\d+):(\d+)/.exec(sunOut.textContent); if (!m) return; var h = +m[1];
      if (lastH !== null && h !== lastH && performance.now() - lastToll > 1500){ lastToll = performance.now(); Snd.hour(h); } lastH = h; }).observe(sunOut, {childList: true, characterData: true, subtree: true}); }, 500);

  /* ── frame loop ── */
  (function frame(now){ stepFlight(now); stepTour(now); stepScenes(now); stepFx(now); stepTrees(); if (spotsOn || cur >= 0) place(now); requestAnimationFrame(frame); })(0);
  window.x3dExtras = {scenes: SCENES, view: function(i){ var v = viewFor(chapterCam(CH[i].cam)); return {p: v.p.toArray(), t: v.t.toArray()}; }, show: show, tour: startTour, weather: setWeather, sound: function(){ bSound.click(); }, spots: spots};
}
if (window.x3dApi) init(window.x3dApi);
document.addEventListener('x3d:ready', function(e){ init(e.detail); });
})();
