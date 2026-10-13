# Додаткові акти з т. XXXIV «Актов Виленской комиссии» (1909), знайдені пошуком по всьому тому:
# лише ті, де згадано Дубровицю, Воробин, Кураш, Клесів, Бродець, Березницю, Жадень та інші села зі списку.
# Тексти переписано зі сканів сторінок; скани — akty-t34-sNNN.jpg (NNN — сторінка видання).
# Запуск (після akty-translations.py):  python3 akty-t34-extra.py && python3 build_akty.py
import json, os, html

VOL_LINE = '«Акты издаваемые Виленскою коммиссіею для разбора древнихъ актовъ. Томъ XXXIV. Акты относящіеся ко времени войны за Малороссію (1654—1667)». Вильна, 1909 г.'


def P(*ps):
    return ''.join('<p>%s</p>' % p for p in ps)


def B(*ps):
    return ''.join('<p><strong>%s</strong></p>' % p for p in ps)


def UL(items):
    return '<ul>' + ''.join('<li><p><strong>%s</strong> — %s</p></li>' % it for it in items) + '</ul>'


def OL(items):
    return '<ol>' + ''.join('<li><p><strong>%s</strong> — %s</p></li>' % it for it in items) + '</ol>'


def META(items):
    return '<ul>' + ''.join('<li><p><strong>%s:</strong> %s</p></li>' % it for it in items) + '</ul>'


def TR(ps):
    return ''.join('<p class="ak-ptitle">%s</p>' % html.escape(p[1:].strip()) if p.startswith('~') else '<p>%s</p>' % html.escape(p) for p in ps)


DOCS = []

# ───────────────────────── № 23 · 1654 ─────────────────────────
DOCS.append(dict(
    id='1654-brodets-klesiv', group='ruina', sort='1654-11-10', date='10 листопада 1654', no='23', volume='XXXIV',
    title='Спалені Тумень, Бродець і Клесів',
    places=['Тумень', 'Бродець', 'Клесів', 'Єзьори', 'Гнойна', 'Вежиці', 'Висоцьк'],
    summary='Урядник маєтності Висоцьк Якуб Матусевич скаржиться від імені Григорія Війни-Ясенецького: у жовтні 1654 року козаки разом із московським військом, ідучи шляхом на Волинь, три дні стояли табором під Висоцьком. Спалили замок і три фільварки, двір у Тумені й два млини при Туменському ставу на Горині, фільварок Бродець зі збіжжям, села Єзьори, Гнойну, Клесів і Вежиці; людей катували, допитуючись про гроші. Возний Ян Ушацький оглянув попелища. Подимне маєток може сплатити хіба з дев’ятнадцяти димів.',
    meta=META([
        ('Видання', VOL_LINE),
        ('Номер документа', '№ 23, с. 22–24.'),
        ('Заголовок публікації', '<em>Заявленіе земянина Григорія Войны-Ясенецкаго о разореніи казаками имѣнія Высоцка, Пинскаго повѣта</em>.'),
        ('Латиномовний заголовок акта', '<em>Protest y rel. w sprawie iegomsci p. Woyny o spustoszenie Wysocka od kozakow</em>.'),
        ('Дата внесення до книг', '10 листопада 1654 року («мца ноября десятого дня»). У друкованому заголовку стоїть «1654 г. Октября 6» — очевидно, перенесено з попереднього документа № 22.'),
        ('Дата реляції возного', '2 листопада 1654 року («msca Nowembra wtorego dnia»).'),
        ('Час подій', 'жовтень 1654 року.'),
        ('Судовий урядник', 'Владислав Казимир Война, підстароста пінський, від князя Альбрехта Станіслава Радзивілла.'),
        ('Архівне посилання / шифр оригіналу', 'Изъ акт. кн. Пинск. грод. суда за 1654—5 г. № 13008, л. 1196.'),
        ('Мова документа', 'руська (судова преамбула й формула запису) та польська (текст скарги й реляції).'),
    ]),
    screens=[
        {'n': 22, 'html': B('№ 23—1654 г. Октября 6.', 'Заявленіе земянина Григорія Войны-Ясенецкаго о разореніи казаками имѣнія Высоцка, Пинскаго повѣта.') +
                         P('Protest y rel. w sprawie iegomsci p. Woyny o spustoszenie Wysocka od kozakow.')},
        {'n': 23, 'html': P(
            'Лета отъ нароженя Сына Божого тисеча шестсотъ пятдесят четвертого, мца ноября десятого дня.',
            'На враде кгродскомъ в замку гдрскомъ Пинскомъ передо мною Владыславомъ Казимеромъ Войною, подстаростимъ Пинскимъ, отъ ясне освецоного княжати его млсти Албрыхта Станислава Радивила, княжати на Олыце и Несвежу, канцлера вел. княз. Лит., старосты Пинского, Кгневского и Тухолского установленымъ, żałował y opowiadał urzędnik y sługa maiętnosci Wysocka iegomsci pana Hrehorego Woyny Jasienieckiego y pani małżąki iegomsci pani Krystyny Ulatowskiey Woyniney pan Jakub Matusewicz o tym, iż gdy w roku teraznieyszym tysiąc szescset pięćdziesiąt czwartym, w mscu oktobrze, ludzie swawolni kozacy rebelizanci ziednoczywszysie z wiarołomnym nieprzyiacielem moskwicinem z Ukrainy do kilkudziesiąt tysięcy ludu w powiat Pinski do Turowa, Dawydgrodka, do Stolina wtargnąwszy z chorągwiami swemi swawolnemi wielkie krzywdy, morderstwa, zaboystwa na smierć y nieznosne szkody poczynili, na domy szlacheckie naiezdzaiąc, maiętnosci, konie, bydło rożne y wszelakie dostatki brali, na ostatek poddanych męczyli, zabiiali, domy, gumna palili, gdzie ydąc traktem na Wołyn y w maiętnosci nazwaney Wysocku y wsiow do niey należących z chorągwiami wszedszy, przez trzy dni pod miastem Wysockim w polu taborem stali, czaty puszczali, w ktorey maiętnosci zamku Wysocku wszystkie dostatki, konie, bydło, fanty pobrali; gumna, domy poddanych popalili, pobrawszy samy zamek y trzy folwarki spalili, w cerkwi Wysockiey aperaty pobrali, swiescenika tamecznego y mieszczan męczyli, pytaiąc się o pieniądzach, rożne męki zadawali y wszelakie ich dostatki, konie, bydło rozne, cyn, miedz y inne rożne rzeczy brali, domy palili, iako też dwor we wsi Tumieniu y młynow dwa przy stawie Tumienskim y rzece Horyniu będące spalili, folwark Brodec spalili ze zbożem do sczętu w popioł przez ogien obrocili, bydło w folwarku pobrali, także folwark pod miastem spalili, wies Jeziory, wies Hnoyną, wieś Klesowo, wieś Wieżycy w niwecz aż do sczętu spalili, poddanych pomęczyli, konie, bydło rożne pobrali y funditus zniesli, a w inszych wsiach także wszystkie dostatki poddanych pobrali, przez ktorą tak wielką desolatią tak sami siebie czym żywić nie maią, iako y powinnosci nie tylko panu swemu, ale y podaczek z ufały seymowey ustanowioney wydać z czego nie maią y niemogą, ktore takowe wielkie spustoszenie y spalenie w niwecz maiętnosci Wysockiey nam urzędowi doniosszy y opowiedziawszy urzędnik iegomsci pana Woyny że dla wielkiego popalenia w niwecz y zabrania poddanych za wielką trudnoscią ledwo z dymow dziewętnastu podymne oddać mogą, tę manifestatią do xiąg grodzkich Pinskich zapisać dał.',
            'Пры которомъ оповеданю, ставшы очевисто енерал повету Пинского Ян Ушацкий, квит свой реляцыйный с печатю и с подписом руки своее также с печатю стороны шляхты прызнал в тые слова:',
            'Ja Jan Uszacki, ienerał iego kr. msci powiatu Pinskiego, zeznawam tym moym rellacynym kwitem, iż roku teraznieyszego tysiąc szescset pięćdziesiąt czwartego, msca Nowembra wtorego dnia, z stroną, szlachtą, panem Pawłem Płotnickim, a panem Iwanem Wysockim byłem wzięty na sprawę niżey mianowaną od pana Jakuba Matusowicza, urzędnika maiętnosci iegomsci pana Hrehora Woyny Jasienieckiego y pani małżonki iegomsci nazwaney Wysocka, w powiecie Pinskim leżącey, gdzie za okazaniem widziałem we wsi Tumieniu mieysca y popioł, mianowali że dwor z budynkami przez kozakow w roku teraznieyszym w mscu oktobrze, tudzież y młynow dwa przy stawie Tumienskim y rzece Horyniu będące spalili, gdzie tylko słupy y pale ogorzałe, gdzie młyny byli, potym do folwarku Brodca przyiachawszy za okazaniem widzielismy także tylko popioł, a węgle')},
        {'n': 24, 'html': P(
            'słupy ogorzałe, także folwark pod miastem w niwecz spalony mianował ten urzędnik, że ci zdraycy kozacy ze zbożem roznym w gumnie y przy gumnie będącym, także budynki popalili. W miasteczku Wysocku mieszczanie opowiedziali, że ciż ludzie swawolni kozacy samych zabiiali, męczyli, pytaiąc się o pieniądzach, konie, bydło rożne y wszystkie ich dostatki w komorach, w swiernach, zamki poodbiiawszy pobrali, że się czym wyżywić nie maią, dom ieden w miescie spalony, iako też y w zamku gdzie budynki byli tylko mieysca a popioł leży. Potym dnia trzeciego iachaliśmy do wsi Jezior, gdzie za okazaniem widzieliśmy tylko popioł, a węgle gdzie wszystkie domy y gumna aż do sczętu popalone. Tamże iachaliśmy do wsi Hnoyna, ktora wszytka wioska do sczętu spalona. Wieś Klesowo i te aż do sczętu spalono, także wieś Wieżyce az do sczętu spaloną, a w drugich wioskach iako opowiadali y mianowali pozostali poddani y urzędnik, że konie, bydło, rożne fanty y inne dostatki domowe pobrali, samych męczyli y na smierć zabiiali, przez ktore popalenie wsiow wysz mianowanych zubożenie y zniszczenie wsiow do tey maiętnosci Wysockiey y należących sami siebie czym żywić y podatkow na seymie przeszłym ufalonych czem oddać niemaią y ten urzędnik iegomsci pana Woyny powiedział, że za wielką trudnoscią ledwo z dymow dziewiętnastu oddać mogą. Co wszystko mną ienerałem y to stroną szlachtą obwiod y opowiedział ten urzędnik y poddani.',
            'A tak ia ienerał z tą stroną szlachtą com widział y słyszał, to wszystko w ten moy kwit rellacyny napisawszy s pieczęcią y s podpisem ręki mey y s pieczęciami strony szlachty do xiąg grodzkich Pinskich daię, Jan Uszacki ienerał ręką. Которое оповедане и сознане енералское и квитъ его до книг кгродских Пинских ест уписан.',
            'Изъ акт. кн. Пинск. грод. суда за 1654—5 № 13008, л. 1196.')},
    ],
    scans=['akty-t34-s022.jpg', 'akty-t34-s023.jpg', 'akty-t34-s024.jpg'],
    persons=OL([
        ('Война-Ясенецький Григорій (Hrehory Woyna Jasieniecki)', 'земянин, власник маєтності Висоцьк.'),
        ('Війнина Христина з Улатовських (Krystyna Ulatowska Woynina)', 'дружина Григорія Війни-Ясенецького, співвласниця.'),
        ('Матусевич Якуб (Jakub Matusewicz / Matusowicz)', 'урядник і слуга маєтності Висоцьк; заявник.'),
        ('Ушацький Ян (Jan Uszacki)', 'генерал (возний) повіту Пінського; автор реляції.'),
        ('Плотницький Павло (Paweł Płotnicki)', 'шляхтич, сторона-свідок огляду.'),
        ('Висоцький Іван (Iwan Wysocki)', 'шляхтич, сторона-свідок огляду.'),
        ('Война Владислав Казимир', 'підстароста пінський, судовий урядник.'),
        ('Радзивілл Альбрехт Станіслав', 'князь на Олиці й Несвіжі, канцлер ВКЛ, староста пінський.'),
    ]),
    placesIdx=UL([
        ('Тумень (Tumień)', 'село з двором; спалено двір і два млини при Туменському ставу на Горині.'),
        ('Бродець (folwark Brodec)', 'фільварок маєтності; спалений зі збіжжям, худобу забрано.'),
        ('Клесів (Klesowo)', 'село маєтності Висоцьк, спалене дощенту.'),
        ('Єзьори (Jeziory)', 'село, спалене дощенту.'),
        ('Гнойна (Hnoyna)', 'село, спалене дощенту.'),
        ('Вежиці (Wieżyce)', 'село, спалене дощенту.'),
        ('Висоцьк (Wysock)', 'містечко із замком, центр маєтності; замок і три фільварки спалено, з церкви забрано начиння.'),
        ('Горинь (Horyń)', 'річка.'),
        ('Турів, Давид-Городок, Столін', 'міста на шляху козацько-московського війська.'),
        ('Волинь', 'напрямок руху війська («traktem na Wołyn»).'),
    ]),
    subjects=META([
        ('Хронологія', 'жовтень 1654 — козацько-московське військо «до кількадесяти тисяч» іде через Пінський повіт на Волинь, три дні стоїть табором під Висоцьком.'),
        ('Збитки', 'спалено замок, три фільварки, двір у Тумені, два млини, фільварок Бродець зі збіжжям, села Єзьори, Гнойна, Клесів, Вежиці; забрано коней, худобу, олово й мідь, церковне начиння («aperaty»).'),
        ('Податки', 'подимне можна сплатити «ледве з дев’ятнадцяти димів».'),
        ('Терміни', '<em>czaty</em> — роз’їзди; <em>tabor</em> — укріплений табір; <em>aperaty</em> — церковне начиння; <em>rellacyny kwit</em> — протокол огляду возного; <em>podymne</em> — податок з диму.'),
    ]),
    nPersons=8,
    translation=TR([
        '~Протестація й реляція у справі його милості пана Війни про спустошення Висоцька козаками.',
        'Року від народження Сина Божого тисяча шістсот п’ятдесят четвертого, місяця листопада десятого дня.',
        'На уряді гродському в замку господарському Пінському, переді мною, Владиславом Казимиром Войною, підстаростою пінським, установленим від ясновельможного князя його милості Альбрехта Станіслава Радзивілла, князя на Олиці й Несвіжі, канцлера Великого князівства Литовського, старости пінського, гнівського й тухольського, скаржився й заявив урядник і слуга маєтності Висоцьк його милості пана Григорія Війни-Ясенецького та дружини його милості, її милості пані Христини з Улатовських Війниної, пан Якуб Матусевич.',
        'Заявив про те, що цього тисяча шістсот п’ятдесят четвертого року, у місяці жовтні, свавільні люди, козаки-бунтівники, об’єднавшись із віроломним ворогом-москвитином, вдерлися з України, кількадесят тисяч люду, в Пінський повіт — до Турова, Давид-Городка, до Століна — зі своїми свавільними корогвами й чинили великі кривди, мордування, вбивства на смерть і нестерпні шкоди: наїжджали на шляхетські доми, брали маєтки, коней, усяку худобу й усілякі статки, а насамкінець підданих катували, вбивали, хати й гумна палили.',
        'Ідучи шляхом на Волинь, вони з корогвами ввійшли й до маєтності, званої Висоцьк, та до сіл, що до неї належать, три дні стояли табором у полі під містом Висоцьком і пускали чати. У цій маєтності, у Висоцькому замку, забрали всі статки, коней, худобу, фанти; гумна й хати підданих попалили, а пограбувавши сам замок і три фільварки, спалили. У Висоцькій церкві забрали начиння; тамтешнього священника й міщан катували, допитуючись про гроші, завдавали різних мук і брали всі їхні статки — коней, різну худобу, олово, мідь та інші речі, — хати палили.',
        'Так само спалили двір у селі Тумені й два млини при Туменському ставу та на річці Горинь; фільварок Бродець спалили зі збіжжям дощенту, обернувши вогнем на попіл, худобу у фільварку забрали; спалили й фільварок під містом; села Єзьори (Jeziory), Гнойну (Hnoyna), Клесів і Вежиці (Wieżyce) спалили вщент, підданих покатували, коней і всяку худобу забрали й винищили до решти, а в інших селах так само забрали в підданих усі статки.',
        'Через таке велике спустошення вони не мають чим ні самих себе прогодувати, ні виконати повинностей не тільки своєму панові, а й податків, установлених сеймовою ухвалою, — не мають із чого й не можуть. Довівши до нашого урядового відома й розповівши про таке велике спустошення й спалення вщент Висоцької маєтності, урядник його милості пана Війни заявив, що через велике спалення вщент і забрання підданих вони з великими труднощами ледве з дев’ятнадцяти димів можуть віддати подимне, і дав записати цю маніфестацію до книг гродських пінських.',
        'При цій заяві, ставши особисто, генерал повіту Пінського Ян Ушацький визнав свій реляційний квит із печаткою й підписом своєї руки, а також із печатками сторони-шляхти, такими словами:',
        'Я, Ян Ушацький, генерал його королівської милості повіту Пінського, визнаю цим моїм реляційним квитом, що цього тисяча шістсот п’ятдесят четвертого року, місяця листопада другого дня, зі стороною-шляхтою, паном Павлом Плотницьким і паном Іваном Висоцьким, був я взятий у нижченазваній справі паном Якубом Матусевичем, урядником маєтності його милості пана Григорія Війни-Ясенецького та дружини його милості, званої Висоцьк, що лежить у Пінському повіті.',
        'Там за показом бачив у селі Тумені місце й попіл: казали, що двір із будівлями козаки спалили цього року в місяці жовтні, а також два млини при Туменському ставу й на річці Горинь, — де були млини, стоять тільки обгорілі стовпи й палі. Потім, приїхавши до фільварку Бродець, за показом бачили так само тільки попіл, вуглини й обгорілі стовпи. Так само фільварок під містом, як казав цей урядник, ті зрадники-козаки спалили дощенту разом зі збіжжям, що було в гумні й біля гумна, і будівлі.',
        'У містечку Висоцьку міщани розповіли, що ті самі свавільні люди, козаки, їх самих убивали, катували, допитуючись про гроші, а коней, різну худобу й усі їхні статки в коморах і свірнах, повідбивавши замки, забрали, тож їм нема чим прогодуватися; у місті спалено одну хату, а в замку, де були будівлі, лежать тільки місце й попіл.',
        'Потім, третього дня, ми поїхали до села Єзьори, де за показом бачили тільки попіл і вуглини: усі хати й гумна спалено дощенту. Звідти поїхали до села Гнойна, яке все спалене дощенту. Село Клесів так само спалене дощенту, і село Вежиці спалене дощенту. А в інших селах, як розповідали й казали піддані, що лишилися, та урядник, забрали коней, худобу, різні фанти й інші хатні статки, самих катували й убивали на смерть.',
        'Через спалення вищеназваних сіл, зубожіння й нищення сіл цієї Висоцької маєтності та її належностей вони не мають чим самих себе прогодувати й податків, ухвалених на минулому сеймі, сплатити; і цей урядник його милості пана Війни сказав, що вони з великими труднощами ледве з дев’ятнадцяти димів можуть віддати. Усе це урядник і піддані мені, генералові, й цій стороні-шляхті показали й розповіли.',
        'Тож я, генерал, з цією стороною-шляхтою, що бачив і чув, усе те написавши в цей мій реляційний квит, з печаткою й підписом моєї руки та з печатками сторони-шляхти, подаю до книг гродських пінських. Ян Ушацький, генерал, рукою. Ця заява, генеральське визнання і його квит вписані до книг гродських пінських.',
    ]),
))

# ───────────────────────── № 135 · 1660 ─────────────────────────
DOCS.append(dict(
    id='1660-universal-ordy', group='ruina', sort='1660-07-02', date='2 липня 1660', no='135', volume='XXXIV',
    title='Козаки переправилися через Горинь біля Березниці',
    places=['Березниця', 'Горинь', 'Турів', 'Висоцьк', 'Пінськ'],
    summary='Хорунжий пінський Василь Альбрехт Орда скликає шляхту повіту. Від урядника давид-городоцького Матусевича прийшла звістка: козаки з московським військом наступають двома загонами — кілька тисяч на чолі з якимось Филипчею переправилися через Горинь від Березниці, а кілька сотень москви з якимось Шидловським підійшли до Турова. Їхні чати вже плюндрують Висоцьк, Теребежов та інші місця ближче до Пінська. Уся шляхта має при зброї стати в Пінську 4 липня під повітову корогву. Це той самий рейд літа 1660 року, після якого постраждали Клесів, Корпилівка, Стрільськ і Воробин.',
    meta=META([
        ('Видання', VOL_LINE),
        ('Номер документа', '№ 135, с. 149–150.'),
        ('Заголовок публікації', '<em>Универсалъ хоружаго Пинскаго Василія Альбрихта Орды съ предписаніемъ всѣмъ шляхтичамъ Пинскаго повѣта собраться на 4 іюля въ Пинскъ, съ полнымъ военнымъ снаряженіемъ, для выступленія противъ московскихъ казачьихъ войскъ</em>.'),
        ('Латиномовний заголовок акта', '<em>Akt. uniwersału iegom. p. chorążego Pinskiego na ziazd na dzień 4 Jullij</em>.'),
        ('Дата документа', '2 липня 1660 року («dnia wtorego Juli, anno tysiąc szesćset szesćdziesiątego»).'),
        ('Судовий урядник', 'Войтех Зеленський, стольник і підстароста пінський, від Яна Кароля Млоцького, старости пінського й гельметського.'),
        ('Архівне посилання / шифр оригіналу', 'Изъ актовой книги Пинскаго грод. суда за 1660 г. № 13012 л. 512.'),
        ('Мова документа', 'руська (преамбула й формула запису) та польська (текст універсалу).'),
    ]),
    screens=[
        {'n': 149, 'html': B('№ 135—1660 г. Іюля 2.', 'Универсалъ хоружаго Пинскаго Василія Альбрихта Орды съ предписаніемъ всѣмъ шляхтичамъ Пинскаго повѣта собраться на 4 іюля въ Пинскъ, съ полнымъ военнымъ снаряженіемъ, для выступленія противъ московскихъ казачьихъ войскъ.') + P(
            'Akt. uniwersału iegom. p. chorążego Pinskiego na ziazd na dzień 4 Jullij.',
            'Лета от нароженя Сына Божого тисеча шестсот шестдесятого, мца июля второго дня.',
            'На враде кгродском в замку гдарском Пинском, передо мною Войтехом Зеленским стольником и подстаростим Пинским, от велможного его млсти пана Яна Кароля Млоцкого Пинского, Гелметского старосты установленымъ, его млст пан Базылей Албрыхтъ Орда, хоружый повету Пинского, универсалъ свой до книг кгродских Пинских ку актыкованю подал, в речы нижей в нем выражоной писаный тыми словы:',
            'Jasnie wielmożnym, wielmożnym w Bodze przewielebnym, wielebnym zacnie urodzonym ichmm panom dygnitarzom urzędnykom ziemskim grodskim, rycerstwu, szlachcie y wszytkim powiatu Pinskiego Zahorodzkiego y Zarzeckiego traktow obywatelom moim wielce msciwym panom y braci powolne moie zaleciwszy usługi; swieżo mię rzetelna od pana Matusowicza urzędnika Dawydgrodzkiego y innych z tamtego uchodzących kraiu doszła przestroga y wiadomosć, iż kozacka przeciwko I. k. m. y Rzptey rebeliiuiąca swawola w swoiey zawziętey nieustaiąc impreazie z wiarołomnym nieprzyiacielem moskwicinem swoie złączywszy siły, iedni w kilku tysięcy z nieiakim Filipczą od Bereznicy przez Horyn przeprawiwszy, a drudzy zaś z nieiakim Szydłowskim w kilkuset moskwy do Turowa przybywszy, z obu stron tak od Bereznicy iako Turowa y Grodka po Stolin y daley pusczaiąc czaty, miasta y wsi iako to Wysock, Terebezow y inni iuż ku Pinskowi bliżey ogniem y mieczem tyransko funditus plondruią y daley (czego im Boże nie pomoż) grasuiąc isć zamyszlaią, zaczem z należney moiey functiey to do wiadomosci wm. m. m. p. donosząc, wielce upraszam, abyście wm. m. m. pp. w swoim obowiązku y powinney ku oyczyznie poczuwaiąc się usłudze, dla całosci oney, samych siebie bezpieczeństwa y ostatniey ostatnich kątow naszych ruiny do miasta I. k. m. Pinska wszyscy kto się ieno szlacheckiego tytułu szczyci praerogatiwą na dzień czwarty Jula praesentys pod chorągiew powiato-')},
        {'n': 150, 'html': P(
            'wą zgromadzić y spolnie z sobą iakobyśmy od takowych incursy nieprzyiacielskich securi zostawać mogli, in armis stawać raczyli, o co y po setnie upraszaiąc wmw msciwych panow onych że mię z moią powolnoscią iako naypilniey zalecam łasce. W Pinsku, dnia wtorego Juli, anno tysiąc szesćset szesćdziesiątego. У того универсалу подпис руки тыми словы. Waszmosciow mych msciwych panow we wszem powolny brat y sługa Bazyli Albrycht Orda, chorąży powiatu Pinskiego. Который универсал за поданемъ его до книг кгродских Пинских есть уписанъ.',
            'Изъ актовой книги Пинскаго грод. суда за 1660 г. № 13012 л. 512.')},
    ],
    scans=['akty-t34-s149.jpg', 'akty-t34-s150.jpg'],
    persons=OL([
        ('Орда Василь Альбрехт (Bazyli Albrycht Orda)', 'хорунжий повіту Пінського; автор універсалу.'),
        ('Матусевич (Matusowicz)', 'урядник давид-городоцький; приніс звістку про наступ.'),
        ('Филипча (Filipcza)', 'козацький ватажок; з кількома тисячами переправився через Горинь від Березниці.'),
        ('Шидловський (Szydłowski)', 'ватажок московського загону в кількасот осіб, що підійшов до Турова.'),
        ('Зеленський Войтех', 'стольник і підстароста пінський, судовий урядник.'),
        ('Млоцький Ян Кароль', 'староста пінський і гельметський.'),
    ]),
    placesIdx=UL([
        ('Березниця (Bereznica)', 'місце переправи козаків через Горинь.'),
        ('Горинь (Horyń)', 'річка.'),
        ('Турів, Городок (Давид-Городок), Столін', 'міста, звідки пускали чати.'),
        ('Висоцьк, Теребежов (Wysock, Terebezow)', 'містечка, які вже плюндрують.'),
        ('Пінськ', 'місце збору шляхти 4 липня 1660 року.'),
        ('Загородський і Зарічний тракти', 'дві частини Пінського повіту.'),
    ]),
    subjects=META([
        ('Посполите рушення', 'шляхта всього повіту має прибути до Пінська «in armis» під повітову корогву.'),
        ('Терміни', '<em>chorąży powiatowy</em> — хорунжий, що веде повітову корогву; <em>czaty</em> — роз’їзди; <em>uniwersał</em> — розпорядження до всієї шляхти повіту.'),
        ('Зв’язок з іншими актами', 'цей рейд описують і скарга Фірлея (вересень 1660) та маніфестація про спалення Воробина (грудень 1660).'),
    ]),
    nPersons=6,
    translation=TR([
        '~Акт універсалу його милості пана хорунжого пінського про з’їзд на 4 липня.',
        'Року від народження Сина Божого тисяча шістсот шістдесятого, місяця липня другого дня.',
        'На уряді гродському в замку господарському Пінському, переді мною, Войтехом Зеленським, стольником і підстаростою пінським, установленим від вельможного його милості пана Яна Кароля Млоцького, старости пінського й гельметського, його милість пан Василь Альбрехт Орда, хорунжий повіту Пінського, подав для внесення до книг гродських пінських свій універсал, написаний у справі, нижче в ньому викладеній, такими словами:',
        'Ясновельможним, вельможним, у Бозі превелебним, велебним, шляхетно уродженим їхнім милостям панам достойникам, урядникам земським і гродським, рицарству, шляхті й усім обивателям повіту Пінського, трактів Загородського й Зарічного, моїм вельми милостивим панам і братії, засвідчивши мої покірні послуги.',
        'Щойно дійшла до мене певна пересторога й звістка від пана Матусевича, урядника давид-городоцького, та від інших, що втікають із того краю: козацьке свавілля, що бунтує проти його королівської милості й Речі Посполитої, не вгаваючи у своїй завзятій затії, з’єднало свої сили з віроломним ворогом-москвитином. Одні, кілька тисяч, на чолі з якимось Филипчею, переправилися від Березниці через Горинь, а інші, кількасот москви, на чолі з якимось Шидловським, прибули до Турова. З обох боків — і від Березниці, і від Турова та Городка — пускаючи чати аж по Столін і далі, вони вже по-тиранськи дощенту плюндрують вогнем і мечем міста й села, як-от Висоцьк, Теребежов та інші, ближче до Пінська, і, чинячи грабунки, замишляють іти далі (чого їм, Боже, не допоможи).',
        'Тож, доводячи це з належного мені уряду до відома ваших милостей, моїх милостивих панів, дуже прошу, щоб ваші милості, відчуваючи свій обов’язок і належну вітчизні службу, задля її цілості, власної безпеки й порятунку останніх куточків нашої руїни зволили всі, хто лише тішиться прерогативою шляхетського титулу, на день четвертий липня особисто зібратися до міста його королівської милості Пінська під повітову корогву й стати при зброї, аби ми разом могли вберегтися від таких ворожих набігів. Про що вдруге й усоте прошу ваших милостей, моїх милостивих панів, і якнайпильніше віддаю себе з моєю покорою під вашу ласку. У Пінську, дня другого липня, року тисяча шістсот шістдесятого.',
        'При тому універсалі підпис руки такими словами: Ваших милостей, моїх милостивих панів, у всьому покірний брат і слуга Василь Альбрехт Орда, хорунжий повіту Пінського. Цей універсал за поданням його вписано до книг гродських пінських.',
    ]),
))

# ───────────────────────── № 176 · 1661 ─────────────────────────
DOCS.append(dict(
    id='1661-zhaden-miliachi', group='ruina', sort='1661-02-28', date='28 лютого 1661', no='176', volume='XXXIV',
    title='Мілячі й Жадень під козацькими залогами',
    places=['Жадень', 'Мілячі', 'Висоцьк', 'Горинь'],
    summary='Пінський войський Арнульф Гедройць заявляє, що його маєтність — містечко Висоцьк із селами Мілячі, Жадень та іншими над Горинню й за Горинню — 1653 року спалили татари й погнали людей у полон. З 1655 року аж до лютого 1661-го маєток тримали козацькі залоги, збирали з нього чинші, подимне й усі прибутки на козацьке військо, кілька разів палили, а в травні 1660 року спалили дощенту й вирізали людей. Подимного він сплатити не може — і сам був вигнанцем.',
    meta=META([
        ('Видання', VOL_LINE),
        ('Номер документа', '№ 176, с. 199.'),
        ('Заголовок публікації', '<em>Заявленіе войскаго Пинскаго повѣта Арнульфа Гедройтя о разореніи м. Высоцка и окрестныхъ селъ во время войны</em>.'),
        ('Латиномовний заголовок акта', '<em>Manifestacya iegom. pana Woyskiego o spalenie Wysocka od kozakow</em>.'),
        ('Дата документа', '28 лютого 1661 року.'),
        ('Судовий урядник', 'Войтех Зеленський, стольник і підстароста пінський, від Яна Кароля Млоцького, старости пінського й гельметського.'),
        ('Архівне посилання / шифр оригіналу', 'Изъ акт. кн. Пинск. грод. суда за 1661 г. № 13013 л. 278.'),
        ('Мова документа', 'руська (преамбула) та польська (текст маніфестації).'),
    ]),
    screens=[
        {'n': 199, 'html': B('№ 176—1661 г. Февраля 28.', 'Заявленіе войскаго Пинскаго повѣта Арнульфа Гедройтя о разореніи м. Высоцка и окрестныхъ селъ во время войны.') + P(
            'Manifestacya iegom. pana Woyskiego o spalenie Wysocka od kozakow.',
            'Лета от нароженя Сына Божого тисеча шестсот шестдесят первого, мца Февраля двадцат осмого дня.',
            'На враде кгродском в замку гдарском Пинском, передо мною Войтехом Зеленским, столником и подстаростим Пинским, от велможного его млсти пана Яна Кароля Млоцкого, Пинского, Гелметского старосты установленым, żałował, opowiadał y solenną manifestatią swoią imsć pan Arnolph Giedroyć, woyski powiatu Pinskiego, zanosił o tem, iż co maiętnosć imsci, miasteczko Wysock z przynależnosciami, wsią Milaczem, Żadaniem y innemi w powiecie Pinskim, nad rzeką y za rzeką Horyniem leżącą, wprzod w roku tysiąc szescset pięćdziesiąt trzecim, nieprzyiaciel krzyża swiętego, tatarzyn, ogniem funditus spalił y wybraniem w płon ludzi zniszczył, a potym w roku tysiąc szescset pięćdziesiąt piątym swawolni kozacy tę maiętnosć manifestuiącego zawoiowawszy, w załogi y w swoią dispositią zabrawszy, oną przez te wszystkie czasy aż do roku teraznieyszego tysiąc szesćseth szesćdziesiąt pierwszego, msca February trzymali, cynsze, podymne y wszelkie prowenta y contributie z tey maiętnosci Wysocka na woysko kozackie brali y iedni drugim podaiąc niszczyli y sami przez się y moskwę kilka raz w tych leciech dzierzenia swego tak miasteczko iako y wsi ogniem palili, a w roku przeszłym, tysiąc szescset szesćdziesiątym, w mscu maiu, funditus spalili, ludzie wyscinali y tę maiętnosć w srogą ruinę obrocili, a dopiero w terazniyszym roku porzucili. Manifestuiące tedy przez wszytkie te lata dzierżenia kozackiego żadnego pożytku y władzy w tey swoiey własnosci mieć, abiuraty na spustoszeniu uczynić, a zatym podatkom y uchwałom seymowym w pełnieniu podymnych do skarbu W. X. Lit., iako tych przeszłych lat, tak pogotowiu teraz, ieżeliby uchwalone były, z tey do ostatka zruinowaney w popioł, a pustki obroconey maiętnosci Wysocka dosyć czynić nie może. Takową tedy dobr swoich desolatią imsć pan woyski opowiedziawszy, iż nie z żadnego niedbalstwa y nieposłuszenstwa podymnych z tey maiętnosci swey nie pełnił, ale y sam będąc wygnancem pełnić z czego nie miał y nie mogł, swiadczył się, prosząc, aby ta imsci manifestatia dla wszelkiey potrzeby była do xiąg grodzkich Pinskich przyięta y zapisana, што ест записано.',
            'Изъ акт. кн. Пинск. грод. суда за 1661 г. № 13013 л. 278.')},
    ],
    scans=['akty-t34-s199.jpg'],
    persons=OL([
        ('Гедройць Арнульф (Arnolph Giedroyć)', 'войський повіту Пінського (1654 — чашник пінський), власник маєтності Висоцьк; заявник.'),
        ('Зеленський Войтех', 'стольник і підстароста пінський, судовий урядник.'),
        ('Млоцький Ян Кароль', 'староста пінський і гельметський.'),
    ]),
    placesIdx=UL([
        ('Жадень (Żadań)', 'село маєтності Висоцьк над Горинню.'),
        ('Мілячі (Milacz)', 'село маєтності Висоцьк.'),
        ('Висоцьк (Wysock)', 'містечко, центр маєтності.'),
        ('Горинь (Horyń)', 'річка; маєтність лежить «над рікою й за рікою Горинню».'),
    ]),
    subjects=META([
        ('Хронологія', '1653 — татари спалюють маєтність і женуть людей у полон; 1655 — лютий 1661 — маєтність у руках козацьких залог; травень 1660 — спалена дощенту, людей вирізано.'),
        ('Податки', 'чинші, подимне, «прибутки й контрибуції» йшли на козацьке військо; власник не може сплатити подимне до скарбу ВКЛ.'),
        ('Терміни', '<em>załogi</em> — військові постої; <em>dispositia</em> — розпорядження, управа; <em>abiuraty</em> — присяги (тут: про спустошення); <em>wygnaniec</em> — вигнанець.'),
    ]),
    nPersons=3,
    translation=TR([
        '~Маніфестація його милості пана войського про спалення Висоцька козаками.',
        'Року від народження Сина Божого тисяча шістсот шістдесят першого, місяця лютого двадцять восьмого дня.',
        'На уряді гродському в замку господарському Пінському, переді мною, Войтехом Зеленським, стольником і підстаростою пінським, установленим від вельможного його милості пана Яна Кароля Млоцького, старости пінського й гельметського, скаржився, заявив і заніс свою урочисту маніфестацію його милість пан Арнульф Гедройць, войський повіту Пінського.',
        'Заявив про те, що його маєтність — містечко Висоцьк із належностями, селом Мілячі, Жаднем та іншими, що лежить у Пінському повіті над річкою й за річкою Горинню, — спершу 1653 року ворог святого хреста, татарин, дощенту спалив вогнем і знищив, забравши людей у полон. А потім 1655 року свавільні козаки, завоювавши маєтність маніфестанта й забравши її під залоги та у своє розпорядження, тримали її весь цей час, аж до нинішнього 1661 року, до місяця лютого. Чинші, подимне й усякі прибутки та контрибуції з цієї маєтності Висоцьк брали на козацьке військо, передаючи її одні одним, нищили, і самі, і через москву, кілька разів за роки свого тримання палили вогнем і містечко, і села, а минулого, 1660 року, у місяці травні, спалили дощенту, людей вирізали й обернули цю маєтність у страшну руїну. І лише цього року її покинули.',
        'Тож маніфестант за всі ці роки козацького тримання не мав жодного прибутку й влади у своїй власності, не міг скласти присяг про спустошення, а отже, не може виконати податків і сеймових ухвал щодо сплати подимного до скарбу Великого князівства Литовського — ні за минулі роки, ні тим паче тепер, якщо їх ухвалять, — з цієї маєтності Висоцьк, зруйнованої до решти, оберненої на попіл і пустку.',
        'Розповівши про таке спустошення своїх маєтків, його милість пан войський засвідчив, що не з жодного недбальства й непослуху не сплачував подимного з цієї своєї маєтності, а й сам, бувши вигнанцем, не мав із чого платити й не міг, і просив, щоб цю його маніфестацію на всякий випадок прийнято й записано до книг гродських пінських, що й записано.',
    ]),
))

# ───────────────────────── № 296 · 1664 ─────────────────────────
DOCS.append(dict(
    id='1664-firlej-khorugva', group='ruina', sort='1664-03-26', date='26 березня 1664', no='296', volume='XXXIV',
    title='Приватна корогва Фірлея «для охорони Дубровиці»',
    places=['Дубровиця', 'Сехови'],
    summary='Князь Стефан Святополк-Четвертинський, опікун малолітніх племінників Миколая й Олександра, протестує проти Миколая Фірлея «на Дубровиці», старостича люблінського. Фірлей привів із Корони до Литви приватну корогву — нібито для охорони своєї маєтності Дубровиця й на публічну оборону, — хоча сеймові конституції забороняли коронному жовнірові переходити до князівства. 14 березня 1664 року його товариство два дні й дві ночі стояло в маєтності Четвертинських Сехови: брали стації грошима, збіжжя, худобу, а відходячи, спалили двері, лави, віконниці, бочки й посуд. Шкоди — понад півтори тисячі злотих.',
    meta=META([
        ('Видання', VOL_LINE),
        ('Номер документа', '№ 296, с. 334.'),
        ('Заголовок публікації', '<em>Заявленіе о дѣятельности въ Пинскомъ повѣтѣ во время Московской войны ротмистра польскихъ войскъ Фирлея и его компаніи</em>.'),
        ('Латиномовний заголовок акта', '<em>Protestacya xiążąt Czetwertenskich na p. Firleia</em>.'),
        ('Дата документа', '26 березня 1664 року; події — 14 березня 1664 року.'),
        ('Судовий урядник', 'Якуб Гінвід Панкевич, стольник і підстароста пінський, від Яна Кароля Млоцького.'),
        ('Архівне посилання / шифр оригіналу', 'Изъ акт. кн. Пинск. грод. суда за 1663 г. № 13016 л. 560 (так у виданні).'),
        ('Пов’язаний документ', 'одразу за ним надруковано № 297 — докладний реєстр збитків у Сеховах, поіменно по кожному підданому.'),
        ('Мова документа', 'руська (преамбула) та польська (текст протестації).'),
    ]),
    screens=[
        {'n': 334, 'html': B('№ 296—1664 г. Марта 26.', 'Заявленіе о дѣятельности въ Пинскомъ повѣтѣ во время Московской войны ротмистра польскихъ войскъ Фирлея и его компаніи.') + P(
            'Protestacya xiążąt Czetwertenskich na p. Firleia.',
            'Лета от нароженя Сына Божого тисеча шестсот шестдесят четвертого, мца Марца двадцат шостого дня.',
            'На враде кгродском в замку гдарском Пинском, передо мною Якубом Кгинвидом Панкевичом, столником и подстаростим Пинским, од велможного его милости пана Яна Кароля Млоцкого, Пинского, Гелметского старосты установленым, opowiadał y soleniter protestował oswiecony xiąże iegomsc Stephan Swiatopołk na Czetwertni Czetwertenski, podkomorzyc woiewodstwa Brasławskiego, rotmistrz Jego kr. msci, iako przyrodzony opiekun xiążąt Mikołaia y Alexandra Swiatopołkow Czetwertenskich, Kasztelanicow Minskich, synowcow swoich, na wielmożnego iegomsci pana Mikołaia na Dubrowicy Firleia, staroscica Lubelskiego, iako rotmistrza, a iegomsci pana Gorayskiego porucznika, panow Brzozowskich, pana Pełhe towarzystwo y inszą kompanią teyże chorągwie, samemu iegomsci panu Firleiowi imiony y przezwiska wiadomemi o tem, iż iegomsć pan Firley s korony polskiey do wielkiego xięstwa Litewskiego dla ochrony maiętnosci swoiey Dubrowicy, w powiecie Pinskim leżącey, chorągiew prywatną y na publiczną obronę zaciągnowszy, legce poważaiąc zwirzchnoscią Jego kr. msci pana naszego miłościwego y nic sie nie oglądaiąc na surowosć prawa pospolitego; konstytuciami seymowemi obostrzonego, aby żołnierz koronny do xięstwa Litewskiego nie przechodził, iako dał xiążęciu iegomsci sprawę pan Nikifor Jachimowicz, urzędnik maiętnosci Siechowskiey, w Pinskim powiecie leżącey, iż w roku teraznieyszym tysiąc szescset szesćdziesiąt czwartego, msca Marca dnia czternastego, nasławszy gwałtownie na pomienioną maiętnosć Siechowy xiążąt paniąt kasztelanicow Minskich, wielkie szkody ubogim poddanym w wybieraniu stacy pieniężnych, zboża rożnego, bydła, fantow y inszych ruchomosci przez dwa dni y dwa noclegi stoiąc poczynili, w ostatku drzwi, ławy okiennice, uszaki, naczynia rożne domowe, beczki, kadzi, cebry, szafliki y insze do gospodarstwa należące ogniem popalili y wielkie a nieznosne krzywdy, o czym osobliwy reiestr iest spisany, że więcey niż na pułtora tysiąca złotych uczynili, o co chcący wszytko xiąże iegomsć pan podkomorzyc Brasławski, postrzegaiąc całosci xiążąt synowcow swoych, in minorenitate zostaiących, z iegomscią panem Firleiem, iako rotmistrzem in foro fory prawnie czynić, tę swoią do xiąg grodzkich Pinskich donosi protestacią, prosząc, aby była przyięta y zapisana, што ест записано.',
            'Изъ акт. кн. Пинск. грод. суда за 1663 г. № 13016 л. 560.')},
    ],
    scans=['akty-t34-s334.jpg'],
    persons=OL([
        ('Фірлей Миколай «на Дубровиці» (Mikołaj na Dubrowicy Firlej)', 'старостич люблінський, ротмістр приватної корогви, власник Дубровиці.'),
        ('Святополк-Четвертинський Стефан (Stephan Swiatopołk Czetwertenski)', 'князь, підкоморич брацлавський, ротмістр; опікун племінників, заявник.'),
        ('Святополк-Четвертинські Миколай і Олександр', 'князі, каштеляничі мінські, малолітні власники Сехів.'),
        ('Горайський (Gorayski)', 'поручник корогви Фірлея.'),
        ('Бжозовські (Brzozowscy)', 'товариші корогви Фірлея.'),
        ('Пелхе (Pełhe)', 'товариш корогви Фірлея.'),
        ('Яхимович Никифор (Nikifor Jachimowicz)', 'урядник маєтності Сехови.'),
        ('Панкевич Якуб Гінвід', 'стольник і підстароста пінський, судовий урядник.'),
    ]),
    placesIdx=UL([
        ('Дубровиця (Dubrowica)', 'маєтність Фірлея в Пінському повіті, «для охорони» якої зібрано корогву.'),
        ('Сехови (Siechowy)', 'маєтність князів Четвертинських у Пінському повіті, де стояла корогва.'),
        ('Корона Польська і Велике князівство Литовське', 'сеймові конституції забороняли коронним жовнірам переходити до ВКЛ.'),
    ]),
    subjects=META([
        ('Військова справа', '<em>chorągiew prywatna</em> — корогва, найнята власним коштом; <em>towarzystwo</em> — товариші корогви; <em>porucznik</em> — заступник ротмістра.'),
        ('Збитки', 'стації грошима, збіжжя, худоба, «фанти»; спалено двері, лави, віконниці, одвірки, бочки, кадки, цебри, шаплики — понад 1500 злотих.'),
        ('Право', '<em>in minorenitate</em> — у неповнолітті; <em>in foro fori</em> — у належному суді.'),
    ]),
    nPersons=8,
    translation=TR([
        '~Протестація князів Четвертинських на пана Фірлея.',
        'Року від народження Сина Божого тисяча шістсот шістдесят четвертого, місяця березня двадцять шостого дня.',
        'На уряді гродському в замку господарському Пінському, переді мною, Якубом Гінвідом Панкевичем, стольником і підстаростою пінським, установленим від вельможного його милості пана Яна Кароля Млоцького, старости пінського й гельметського, заявив і урочисто протестував ясновельможний князь його милість Стефан Святополк на Четвертні Четвертинський, підкоморич воєводства Брацлавського, ротмістр його королівської милості, як природний опікун князів Миколая й Олександра Святополків-Четвертинських, каштеляничів мінських, своїх племінників.',
        'Протестував на вельможного його милість пана Миколая Фірлея на Дубровиці, старостича люблінського, як ротмістра, і на його милість пана Горайського, поручника, панів Бжозовських, пана Пелхе — товариство — та на іншу компанію тієї ж корогви, відому самому його милості панові Фірлею на ім’я й прізвисько, про те, що його милість пан Фірлей, найнявши в Короні Польській приватну корогву — для охорони своєї маєтності Дубровиця, що лежить у Пінському повіті, і на публічну оборону, — привів її до Великого князівства Литовського, легковажачи зверхністю його королівської милості, пана нашого милостивого, і зовсім не зважаючи на суворість посполитого права, обостреного сеймовими конституціями, щоб коронний жовнір до князівства Литовського не переходив.',
        'Як доповів князю його милості пан Никифор Яхимович, урядник маєтності Сехови, що лежить у Пінському повіті, цього тисяча шістсот шістдесят четвертого року, місяця березня чотирнадцятого дня, ці люди, силоміць наслані на згадану маєтність Сехови князів-паничів, каштеляничів мінських, стоячи два дні й два нічліги, завдали убогим підданим великих шкод, вибираючи стації грошима, різне збіжжя, худобу, фанти та інші рухомості, а насамкінець спалили двері, лави, віконниці, одвірки, різний хатній посуд, бочки, кадки, цебри, шаплики та інше господарське начиння. Великих і нестерпних кривд, про які складено окремий реєстр, наробили більш як на півтори тисячі злотих.',
        'Бажаючи за все це, дбаючи про цілість князів-племінників, які перебувають у неповнолітті, правно чинити з його милістю паном Фірлеєм як ротмістром у належному суді, князь його милість пан підкоморич брацлавський доносить цю свою протестацію до книг гродських пінських і просить, щоб її прийнято й записано, що й записано.',
    ]),
))

# ───────────────────────── № 361 · 1665 ─────────────────────────
DOCS.append(dict(
    id='1665-prysiahy-spustoshennia', group='ruina', sort='1665-10-07', date='7 жовтня 1665', no='361', volume='XXXIV',
    title='Присяги про спустошення: Кураш і Дубровиця Юрія Борка',
    places=['Кураш', 'Дубровиця', 'Висоцьк', 'Горинь', 'Пінськ'],
    summary='На жовтневих рочках 1665 року пінський староста Ян Кароль Млоцький приймає заяви шляхти про спустошені маєтки, з яких не можна платити подимного. Серед них — маєтність Кураш ловчини Кашевської та маєтність Дубровиця Юрія Борка над Горинню (той самий Борек, про якого «Реєстр збитків 1665 року»): разом із Висоцьком Тетері й селами за Горинню від Норинська їх «безперестанку нищать свавільні люди, дейнеки». Пінські бурмистри присягають, що місто двічі спалене і подимне може дати лише з 45 димів. Староста передає справу до скарбового трибуналу у Вільні.',
    meta=META([
        ('Видання', VOL_LINE),
        ('Номер документа', '№ 361, с. 403–404.'),
        ('Заголовок публікації', '<em>Присяжное показаніе объ опустошеніяхъ въ г. Пинскѣ и Пинскомъ повѣтѣ во время Московской войны</em>.'),
        ('Латиномовний заголовок акта', '<em>Atestacyia urzędowa strony przysiąg spustoszenia</em>.'),
        ('Дата документа', '7 жовтня 1665 року; рочки гродські, що припали на 1 жовтня.'),
        ('Судовий урядник', 'Ян Кароль Млоцький, староста пінський і гельметський; підписав Станіслав Казимир Токарський, підстолій і підстароста пінський.'),
        ('Архівне посилання / шифр оригіналу', 'Изъ акт. кн. Пинскаго грод. суда за 1665 годъ, № 13017, л. 106.'),
        ('Мова документа', 'руська (преамбула) та польська (текст атестації).'),
    ]),
    screens=[
        {'n': 403, 'html': B('№ 361—1665 г. Октября 7.', 'Присяжное показаніе объ опустошеніяхъ въ г. Пинскѣ и Пинскомъ повѣтѣ во время Московской войны.') + P(
            'Atestacyia urzędowa strony przysiąg spustoszenia.',
            'Лета от нароженя Сына Божого тисеча шестсот шестдесят пятого, мца октебра семого дня.',
            'На рочках кгродских в замку гдарскомъ Пинскомъ, мца Октебра первого дня припалых и судовне порядком правнымъ отправованыхъ, передо мъною Яномъ Каролемъ Млоцъкимъ, Пинскимъ, Гелметским старостою, stanąwszy oblicznie Jmsc pan Kazimierz Giedroic od iasnie oswieconey xiężny ieymsci Radziwiłłowey, kanclerzyney wielkiego xięstwa Litewskiego wnosił, że lubo to według conuocatiey Grodzienskiey w roku teraznieyszym odprawowaney, roczki Septembrowe za słaboscią zdrowia tak samego wielmożnego imsci pana starosty Pinskiego, iako y za obłożną też chorobą imsci pana stolnika y podstarosciego teraznieyszego sądzone nie były, na kturych roczkach spustoszenia y zniszczenia w economiey Pinskiey, w dzierżeniu xiężny ieymsci będącey, opowiadać y okazać mieli, iednak na teraznieyszych roczkach oktobrowych przy pokazanych manifestacyach y obductiach ieneralskich z niektorych woytowstw do iuramentu stawili, y tąż imsć pan Stephan Tur, sędzia grodzki Pinski opowiadał, iż z dobr wielebney capituły Wilenskiey w Pirkowiczach u siebie maiących zastawnych wszyscy poddani precz rozeszli, także y z maiętnosci swoiey imsc pan Giedroic tąż wnosząc na spustoszeniu ze wsi Iwanik do iuramentu poddanego przypowiadał y też od ichmsciow panow obywatelow rożnych osob powiatu Pinskiego pan Samuel Olechnowicz Łopacki tąż wnosił, że iako maiętnosć iasnie oswieconey xiężny ieymsci Radziwiłłowey podczaszyney wielkiego xięstwa Litewskie-')},
        {'n': 404, 'html': P(
            'go, nazwana Dawyd Grodek y wsi do niey należące, od nieprzyiaciela moskwicina y y swawolnych ludzi deynekow od czasu niemałego zgrassowane, a niektore wsi y ogniem popalone są, o co także manifestacyie y relacyie ieneralskie oglądania pogorzałych domow pokazowano, na ktorych desolatiach z włosci Dawyd Grodeckiey woytow dwoch do iuramentu na pogorzałych dymach przypowiadał, y o drugich ichmsciow, iako to z maiętnosci Turowa y Smiedzina, dobr iasnie wielmożnych ichmosciow panow Lubomirskich, ktore od tychże ludzi swawolnych zniszczone zostali, od ieymsci pani Kaszewskiey łowczyney Wołynskiey maiętnosć Kurasz, imsci pana Jerzego Borka maiętnosć Dubrowica przy rzece Horyni będące, imsci pana Tetery maiętnosć Wysock y drugie wsi za Horynią od Norzynska będące w ustawicznych od tychże ludzi swawolnych deynekow zniszczone zostali, iako też iasnie wielmożnego imsci pana Naruszewicza podkanclerzego wielkiego xięstwa Litewskiego maiętnosć Hniewczycka y Drużyłowska od woysk koronnych y litewskich przechodow y wybierania chlebowych pndzy, poddani rozeysć musieli, także y iasnie wielmożnego imsci pana Kopcia woiewody Połockiego nazwane Janow y Mohilne y inne wsi od tychże woysk zniszczeni y zubożeni zostali, od ktorego uciążenia rozeisć się musieli, y inni ichmosc panowie obywatele tąż wnosili y manifestacyie swoie pokazywali y poddanych swoich do przysięgi na takowych desolatiach przypowiadali, burmistrzowie miasta Pinskiego prawa Maydeburskiego wnosili, że po pierwszey od roku tysiąc szesćset pięćdziesiąt pierwszego po ostatniey abiuracie w roku tysiąc szesćset pięćdziesiąt piątym y tysiąc szesćset szescdziesiątym, moskwa s kozakami po dwakroć miasto fundytus palili, o co są manifestacyie, na teraznieyszym terminie dwoch radnych do przysięgi przypowiadali, że więcey wydać podymnego nie mogą, tylko z dymow czterdziestu pięciu, w czym wszystkim ia starosta nie widząc w akcie conuocatiey o tym nic wyraznego, aby na takowych desolatiach mieli iuramenta być wykonywane na rossądek y uznanie do sądu ichmsciow, Trybunału skarbowego, ktory tąż conuocatią w Wilniu naznaczony iest, odsyłam. Которая справа до книг кгродских Пинских ест уписана. Stanisław Kazimierz Thokarski podstoli y podstarosci p. Pin.',
            'Изъ акт. кн. Пинскаго грод. суда за 1665 годъ, № 13017, л. 106.')},
    ],
    scans=['akty-t34-s403.jpg', 'akty-t34-s404.jpg'],
    persons=OL([
        ('Борек Юрій (Jerzy Borek)', 'пан, тримач маєтності Дубровиця над Горинню (той самий Борек, що в «Реєстрі збитків» 1665 року).'),
        ('Кашевська, ловчина волинська (Kaszewska)', 'власниця маєтності Кураш (див. акти 1654 і 1658 років).'),
        ('Тетеря (Tetera)', 'пан, власник маєтності Висоцьк.'),
        ('Млоцький Ян Кароль', 'староста пінський і гельметський; голова суду.'),
        ('Гедройць Казимир (Kazimierz Giedroic)', 'уповноважений княгині Радзивіллової; власник села Іваники.'),
        ('Радзивіллова', 'княгиня, канцлерова ВКЛ, тримачка Пінської економії.'),
        ('Тур Стефан (Stephan Tur)', 'суддя гродський пінський; тримав Пірковичі капітули віленської.'),
        ('Олехнович-Лопацький Самуїл (Samuel Olechnowicz Łopacki)', 'заявник від маєтності Давид-Городок.'),
        ('Любомирські', 'власники Турова й Смедина.'),
        ('Нарушевич', 'підканцлер ВКЛ, власник Гнєвчиць і Дружилович.'),
        ('Копець (Kopeć)', 'воєвода полоцький, власник Янова й Могильного.'),
        ('Токарський Станіслав Казимир (Stanisław Kazimierz Thokarski)', 'підстолій і підстароста пінський.'),
    ]),
    placesIdx=UL([
        ('Кураш (Kurasz)', 'маєтність ловчини Кашевської, нищена дейнеками.'),
        ('Дубровиця (Dubrowica)', 'маєтність Юрія Борка «над річкою Горинню», нищена дейнеками.'),
        ('Висоцьк (Wysock)', 'маєтність Тетері; разом з іншими селами «за Горинню від Норинська».'),
        ('Горинь (Horyń)', 'річка.'),
        ('Пінськ', 'місто магдебурзького права, двічі спалене (1655 і 1660); подимне — лише з 45 димів.'),
        ('Давид-Городок, Турів, Смедин, Пірковичі, Іваники, Гнєвчичі, Дружиловичі, Янів, Могильне', 'інші спустошені маєтності Пінського повіту.'),
    ]),
    subjects=META([
        ('Хто нищить', '«свавільні люди, дейнеки» (ватаги повсталих селян і козаків), а також коронні й литовські війська, що проходять і вибирають «хлібні гроші».'),
        ('Процедура', 'на рочках шляхта показує маніфестації й реляції возних і приводить війтів та підданих до присяги про спустошення; староста передає справу до скарбового трибуналу у Вільні.'),
        ('Терміни', '<em>deynekowie</em> — дейнеки; <em>conuocatia</em> — конвокаційний сейм (тут — у Гродно 1665 року); <em>obductia</em> — огляд возним; <em>iuramentum</em> — присяга; <em>abiurata</em> — присяга про спустошення.'),
    ]),
    nPersons=12,
    translation=TR([
        '~Урядова атестація щодо присяг про спустошення.',
        'Року від народження Сина Божого тисяча шістсот шістдесят п’ятого, місяця жовтня сьомого дня.',
        'На рочках гродських у замку господарському Пінському, що припали на перше жовтня й відбувалися правним судовим порядком, переді мною, Яном Каролем Млоцьким, старостою пінським і гельметським, ставши особисто, його милість пан Казимир Гедройць від ясновельможної княгині її милості Радзивіллової, канцлерової Великого князівства Литовського, заявив: хоча, згідно з конвокацією, що відбулася цього року в Гродні, вересневі рочки через слабе здоров’я самого вельможного його милості пана старости пінського, а також через тяжку хворобу його милості пана стольника й теперішнього підстарости не судилися — а на них мали заявити й показати спустошення та знищення в Пінській економії, що в держанні її милості княгині, — проте на цих жовтневих рочках, показавши маніфестації й огляди генералів, вони привели до присяги війтів із деяких війтівств.',
        'Так само його милість пан Стефан Тур, суддя гродський пінський, заявив, що з маєтків велебної капітули віленської в Пірковичах, які він тримає в заставі, всі піддані розійшлися геть. Так само й його милість пан Гедройць, заявляючи про спустошення своєї маєтності, привів до присяги підданого з села Іваники. А від їхніх милостей панів обивателів, різних осіб Пінського повіту, пан Самуїл Олехнович-Лопацький так само заявив, що маєтність ясновельможної княгині її милості Радзивіллової, підчашиної Великого князівства Литовського, звана Давид-Городок, і села, що до неї належать, уже чималий час розграбовані ворогом-москвитином і свавільними людьми, дейнеками, а деякі села й спалені; про це теж показано маніфестації й реляції генералів з оглядів погорілих хат. На тих спустошеннях він привів до присяги на погорілих димах двох війтів із Давид-Городоцької волості.',
        'І про інші маєтності їхніх милостей заявлено: про маєтності Турів і Смедин, добра ясновельможних їхніх милостей панів Любомирських, які знищено тими самими свавільними людьми; від її милості пані Кашевської, ловчини волинської, — про маєтність Кураш; від його милості пана Юрія Борка — про маєтність Дубровиця, що над річкою Горинню; від його милості пана Тетері — про маєтність Висоцьк та інші села за Горинню від Норинська, які безперестанку нищать ті самі свавільні люди, дейнеки.',
        'Так само ясновельможного його милості пана Нарушевича, підканцлера Великого князівства Литовського, маєтності Гнєвчицька й Дружиловська від проходів коронних і литовських військ і вибирання хлібних грошей: піддані мусили розійтися. Так само й ясновельможного його милості пана Копця, воєводи полоцького, Янів, Могильне та інші села тими самими військами знищено й зубожено, і від цього тягаря піддані мусили розійтися. Інші їхні милості пани обивателі так само заявляли, показували свої маніфестації й приводили своїх підданих до присяги про такі спустошення.',
        'Бурмистри міста Пінська магдебурзького права заявили, що після першої з 1651 року, по останній присязі про спустошення, у 1655 і 1660 роках москва з козаками двічі спалила місто дощенту, про що є маніфестації; на цьому терміні вони привели до присяги двох радних, що більше подимного дати не можуть, тільки з сорока п’яти димів.',
        'У всьому цьому я, староста, не бачачи в акті конвокації нічого виразного про те, щоб на таких спустошеннях мали складатися присяги, відсилаю на розсуд і визнання суду їхніх милостей — Трибуналу скарбового, призначеного тією ж конвокацією у Вільні. Ця справа вписана до книг гродських пінських. Станіслав Казимир Токарський, підстолій і підстароста пінський.',
    ]),
))

ROOT = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(ROOT, 'akty-data.json')
D = json.load(open(PATH, encoding='utf-8'))
ids = set(d['id'] for d in DOCS)
D = [d for d in D if d['id'] not in ids] + DOCS
json.dump(D, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', len(D))
