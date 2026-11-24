
> build · deepseek-v4.1-flash-free
我先查看项目结构，了解现有的引擎代码和约定。
→ Read src/engine/rng.js 
$ ls; echo "---"; ls src; echo "---"; ls src/engine; echo "---"; ls tests 2>$null; echo "---"; cat package.json
Directory: D:\Games\greyharbor

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d----          2026/11/24    21:44                demo
d----          2026/11/24    22:20                docs
d----          2026/11/24    21:44                research
d----          2026/11/24    21:44                screenshots
d----          2026/11/24    22:15                scripts
d----          2026/11/24    21:44                src
d----          2026/11/24    21:44                tests
-a---          2026/10/17     8:32            452 .gitignore
-a---          2026/10/17     8:32              0 .nojekyll
-a---          2026/11/24    21:06            207 ������Ϸ.bat
-a---          2026/11/24    21:58           4934 card-table-v1.csv
-a---          2026/10/17     8:32           1600 index.html
-a---          2026/10/17     8:32           1069 LICENSE
-a---          2026/11/24    21:56          75719 migration-plan.md
-a---          2026/10/17     8:32            497 package.json
-a---          2026/11/24    22:27          77424 phase1-transcript.md
-a---          2026/11/24    22:30              0 phase2.1-transcript.md
-a---          2026/10/17     8:32           8059 README.md
-a---          2026/10/17     8:32           1944 server.mjs
---

    Directory: D:\Games\greyharbor\src

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d----          2026/11/24    22:16                data
d----          2026/11/24    21:44                engine
d----          2026/11/24    21:44                styles
d----          2026/11/24    21:44                ui
-a---          2026/10/17     8:32          36591 app.js
-a---          2026/10/17     8:32            383 main.js
---

    Directory: D:\Games\greyharbor\src\engine

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          2026/10/17     8:32          72995 ai.js
-a---          2026/10/17     8:32           3468 deck.js
-a---          2026/10/17     8:32          65385 engine.js
-a---          2026/10/17     8:32           1543 rng.js
-a---          2026/10/17     8:32           6753 scoring.js
---

    Directory: D:\Games\greyharbor\tests

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          2026/10/17     8:32          33957 ai.test.mjs
-a---          2026/10/17     8:32          34676 card-data.test.mjs
-a---          2026/10/17     8:32          24801 data-audit.test.mjs
-a---          2026/10/17     8:32           2027 e2e.test.mjs
-a---          2026/10/17     8:32          32560 engine.test.mjs
-a---          2026/10/17     8:32           7376 fixtures.mjs
---
{
  "name": "gwent-classic-web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Web-based Gwent (The Witcher 3) with faithful rules, full card pool, upgraded visuals and effects.",
  "scripts": {
    "start": "node server.mjs",
    "test": "node --test 'tests/*.test.mjs'",
    "check": "node --test 'tests/*.test.mjs'",
    "e2e": "node scripts/e2e.mjs --mode=full",
    "e2e:smoke": "node scripts/e2e.mjs --mode=smoke"
  },
  "engines": {
    "node": ">=20"
  }
}
> build · deepseek-v4.1-flash-free
$ ls docs; echo "---"; ls scripts; echo "---"; ls src/data | Select-Object -First 20
Directory: D:\Games\greyharbor\docs

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          2026/10/17     8:32          17038 ARCHITECTURE.md
-a---          2026/10/17     8:32           9829 ART_DIRECTION.md
-a---          2026/10/17     8:32          23526 GAME_RULES.md
-a---          2026/11/24    22:24          51441 GREYHARBOR_RULES_V1.md
-a---          2026/10/17     8:32          47358 QA_RULES_AUDIT.md
---

    Directory: D:\Games\greyharbor\scripts

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          2026/10/17     8:32          36706 e2e.mjs
-a---          2026/11/24    22:19          25004 import-card-table.mjs
---

    Directory: D:\Games\greyharbor\src\data

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          2026/10/17     8:32          20911 ability-text.js
-a---          2026/11/24    22:27          12234 card-table.normalized.json
-a---          2026/10/17     8:32         110372 cards.js
-a---          2026/10/17     8:32           7669 db.js
-a---          2026/10/17     8:32          13840 decks.js
-a---          2026/10/17     8:32           4273 factions.js
-a---          2026/10/17     8:32          15320 leaders.js
$ Select-String -Path migration-plan.md -Pattern "2\.1|白板|阶段2" -Context 2,8 | Select-Object -First 40
migration-plan.md:45: 1402  41.30 D:\Games\greyharbor\src\styles\card.css
  migration-plan.md:46: 2043  51.00 D:\Games\greyharbor\src\styles\deckbuilder.css
> migration-plan.md:47:  839  22.10 D:\Games\greyharbor\src\styles\fx.css
  migration-plan.md:48: 1879  47.50 D:\Games\greyharbor\src\styles\screens.css
  migration-plan.md:49:  261   6.20 D:\Games\greyharbor\src\styles\theme.css
  migration-plan.md:50: 3202 145.70 D:\Games\greyharbor\src\ui\art.js
  migration-plan.md:51:  929  34.90 D:\Games\greyharbor\src\ui\audio.js
  migration-plan.md:52:  785  32.90 D:\Games\greyharbor\src\ui\board.js
  migration-plan.md:53:  136   4.80 D:\Games\greyharbor\src\ui\card-fallback.js
  migration-plan.md:54:  708  27.10 D:\Games\greyharbor\src\ui\card-render.js
  migration-plan.md:55: 1371  58.50 D:\Games\greyharbor\src\ui\deckbuilder.js
  migration-plan.md:944:39: ### 1.3 ��??????????��??
  migration-plan.md:945:58: ## 2. ???????????
> migration-plan.md:946:80: ### 2.1 ??????
  migration-plan.md:947:91: ## 3. ??��??????
  migration-plan.md:948:93: ### 3.1 ??? Spy
  migration-plan.md:949:99: ### 3.2 ?? Medic
  migration-plan.md:950:105: ### 3.3 ???? Muster
  migration-plan.md:951:118: ### 3.4 ???? Tight Bond
  migration-plan.md:952:121: ### 3.5 ??? Morale
  migration-plan.md:953:124: ### 3.6 ???? Agile
  migration-plan.md:954:127: ### 3.7 ???? Scorch????��??????
  migration-plan.md:1141:������á�**����������ʩ��������д���ġ����պ��л����**���ķ�ʽ����������ԭ�ļ���߸ı߲¡�
  migration-plan.md:1142:
> migration-plan.md:1143:### 2.1 ����ԭ��
  migration-plan.md:1144:
  migration-plan.md:1145:1. **��������**��CSV �� �淶�� JSON �� ���� `cards.js`�������ļ����ָġ�
  migration-plan.md:1146:2. **Ч���ṹ��**������ֻ�� `effects[]`�����������ģ������İ��� `effect-text.js` �ӽṹ������
��Ⱦ�����Ա�֤һ�¡�
  migration-plan.md:1147:3. **������Լ����**������ʹ�� `createGame / apply / respond / viewFor / getActions / pending /
 clone` ������״������ UI/AI/���Ը���ɱ���
  migration-plan.md:1148:4. **������Ϣ����**��`viewFor(pov)` ��ȷ��Щ�ֶοɼ���AI ֻ���Լ��� view���������ݡ��������Ʋ�
��й©��
  migration-plan.md:1149:5. **UI Χ�����淨����**�����ص㡢˫�桢���ǡ�ҹ����ӡ/����/װ��/���ƣ����� FLIP���������Ρ���
�ӡ���Ƶ�Ⱦֲ�������
  migration-plan.md:1150:6. **�����ش����ȹ鵵**����ģ���� `-v2` ����Ŀ¼���п������ɲ���/���ĵ������׼�ͨ��ǰ��ɾ����
  migration-plan.md:1151:
  migration-plan.md:1380:### �׶� 2�����棨headless��Node ����Ϊ����
  migration-plan.md:1381:
> migration-plan.md:1382:#### 2.1 ����״̬��
  migration-plan.md:1383:
  migration-plan.md:1384:- �� `engine.js`��`scoring.js`��`view.js`��`events.js`��`deck.js`��`night.js`��
> migration-plan.md:1385:- ��ֻʵ�֡��װ���λ������ҹ�����ص㡢���ǡ��غ�/Pass�����á��Ʒ֡�ʤ����view��clone��RNG��
  migration-plan.md:1386:- ����Ч����ʱ���ӣ�ȷ���Ǽܿ��ܡ�
  migration-plan.md:1387:
  migration-plan.md:1388:**��֤**
  migration-plan.md:1389:
  migration-plan.md:1390:- ����/��ҹ�л�/�Ʒ�/���ǹ���/ʤ��/ƽ�ֲö���
  migration-plan.md:1391:- ȷ���ԣ�ͬ����ͬ�������н��һ�¡�
  migration-plan.md:1392:- `clone()` �����ݲ���Ⱦԭ�֡�
  migration-plan.md:1393:- ������Ϣ��`viewFor(0)` �������������ƣ��������ݲ�й©��
  migration-plan.md:1395:- 1000 ������Ϸ���������������������
  migration-plan.md:1396:
> migration-plan.md:1397:**�˳�����**���װ��Ծֿ�����������
  migration-plan.md:1398:
  migration-plan.md:1399:#### 2.2 ����Ч��ϵͳ
  migration-plan.md:1400:
  migration-plan.md:1401:- `engine/effects/*`�������ʵ������Ч����
  migration-plan.md:1402:- 30 �ſ����Ž��룻ÿ�ſ�����һ�� golden scenario��
  migration-plan.md:1403:- �¼������� UI ������Ϣ��
  migration-plan.md:1404:
  migration-plan.md:1405:**��֤**
  migration-plan.md:1518:- **1.1 ����������ʼ**������������
  migration-plan.md:1519:- **1.2 / 1.3 �����׶� 0 �Ĺ���ö�**��
> migration-plan.md:1520:- **2.1 ���� 1.1 + �׶� 0**�����������װ嵥λ��
  migration-plan.md:1521:- **3.1 ���� 1.2 ������ schema**������ 2.x ���С�
> migration-plan.md:1522:- **3.2 ���� 2.1 + 2.2**��
  migration-plan.md:1523:- **3.3 ���� 2.4**��
  migration-plan.md:1524:- **3.4 ���� 3.2**��
  migration-plan.md:1525:
  migration-plan.md:1526:---
  migration-plan.md:1527:
  migration-plan.md:1528:## 5. ���� 3 ����������
  migration-plan.md:1529:
  migration-plan.md:1530:### ���� 1������δ���壬�����ı�����ִ�У���ϼ���
  migration-plan.md:1625:2. **�����������**�������淶�� JSON + 10 ���޸� diff + �Ƴ�ͳ�ƣ��������档
  migration-plan.md:1626:3. **��д `RULES_V1` + Ч�� DSL �ݰ�**���� 30 �ſ��������գ�ȷ��û���޷������Ч����
> migration-plan.md:1627:4. **���ſ�����**�����װ���λ��ͨ��ҹ���ٽ�Ч�����ٽ� AI������� UI��
  migration-plan.md:1628:
  migration-plan.md:1629:��������˳���ƽ���������Զ������յĳɹ��ǣ�**30 �ſ� 100% �ṹ�� + ������� 0 error + ÿ��
Ӫһ�׺Ϸ�Ԥ��**����ʱ������Ҫдһ������� UI ���롣
> build · deepseek-v4.1-flash-free
$ Select-String -Path docs/GREYHARBOR_RULES_V1.md -Pattern "理智|三夜|梦境|换牌|Pass|收招|计分" | Select-Object -First 60
docs\GREYHARBOR_RULES_V1.md:1:# ���Ҹ���ҹ������淶 �� v1.0
docs\GREYHARBOR_RULES_V1.md:12:2. ���顢����������
docs\GREYHARBOR_RULES_V1.md:13:3. ����ϵͳ
docs\GREYHARBOR_RULES_V1.md:30:- һ����������� **��ҹ** ��ɣ�**��Ӯ��ҹ�߻�ʤ**����ҹ��ʤ����
docs\GREYHARBOR_RULES_V1.md:32:- ˫������ӵ�� **������Sanity��**����ʼ **6 ��**������ 6������ 0�����ǹ����һ�������и�
��
docs\GREYHARBOR_RULES_V1.md:33:- �����������ص㣺**�ֳ���scene��**��**������archive��**��**�ξ���dream��**����λ�ڵص�
�г������ڣ�ҹ��֮�� **���峡**��
docs\GREYHARBOR_RULES_V1.md:34:- ÿ�ŵ�λ/������ **������** �� **�����** ����ս�������������� ��3 ʱ��������棻���
��ÿ�����̶�������֮�����Ǳ仯����ת��
docs\GREYHARBOR_RULES_V1.md:41:1. **��������**��һ�����ǽ��� 0���÷������и���
docs\GREYHARBOR_RULES_V1.md:43:3. **��ҹ������δ������ʤ**���� ��1.3 ��ƽ��/ tiebreak �����ж���
docs\GREYHARBOR_RULES_V1.md:47:- ���������鷢����ÿ������/����Ч�� **��ȫ����֮��**��ҹ�ֽ���֮ǰ��
docs\GREYHARBOR_RULES_V1.md:48:- ��ͬһ���ν����˫������ͬʱΪ 0���� **ƽ��**��
docs\GREYHARBOR_RULES_V1.md:49:- ��һ����ͬһҹ�Ȼ��õ� 2 ��ҹʤ������Ч���������㣬**���ǹ�������**���÷��и���
docs\GREYHARBOR_RULES_V1.md:66:2. ҹ����ͬ���Ƚ�˫�� **ʣ������**������Ӯ�ø�ҹ��
docs\GREYHARBOR_RULES_V1.md:67:3. ����Ҳ��ͬ����ҹΪ **ƽҹ**��˫���������ҹʤ��
docs\GREYHARBOR_RULES_V1.md:70:��ҹ������δ���˴ﵽ 2 ��ҹʤʱ�����αȽϣ�
docs\GREYHARBOR_RULES_V1.md:73:2. ��ҹҹ���ܺ͸����߻�ʤ��
docs\GREYHARBOR_RULES_V1.md:74:3. �������������߻�ʤ��
docs\GREYHARBOR_RULES_V1.md:77:> ע�⣺ƽҹ�����ش���ҹ��Ӳ���ޡ�
docs\GREYHARBOR_RULES_V1.md:85:- ˫���������ƶѡ����ơ���ͨ���ƶѡ���Ԩ���ƶѡ�
docs\GREYHARBOR_RULES_V1.md:97:## 2. ���顢����������
docs\GREYHARBOR_RULES_V1.md:105:- ������� **2 ��**��ֻ����һ�Ρ�
docs\GREYHARBOR_RULES_V1.md:124:5. ˫��������Ϊ **6**��
docs\GREYHARBOR_RULES_V1.md:127:   - �ڶ�����ҹ�� **��һҹ�ܷ�** ���֣�
docs\GREYHARBOR_RULES_V1.md:133:- �ڶ�ҹ������ҹ��ʼʱ��˫������ **2 ��**��
docs\GREYHARBOR_RULES_V1.md:145:## 3. ����ϵͳ
docs\GREYHARBOR_RULES_V1.md:151:- ���ޣ�**0**����������Ϊ����
docs\GREYHARBOR_RULES_V1.md:152:- �����ǿ�ҹ��������Դ��������ҹ������ʱ�Զ�������
docs\GREYHARBOR_RULES_V1.md:154:### 3.2 �������ۣ�Sanity Cost��
docs\GREYHARBOR_RULES_V1.md:158:- ��������ʱ���ܴ���ÿ���
docs\GREYHARBOR_RULES_V1.md:160:- ��ͼ��ݵļ���ֻ���� `sanityCost`�������١�ʧȥ��������Ч����
docs\GREYHARBOR_RULES_V1.md:161:- �������۲��ǡ�ʧȥ���ǡ���Ч�������ܱ�����ֹʧȥ���ǡ���Ч����ֹ��v1 ���޴���Ч������
docs\GREYHARBOR_RULES_V1.md:165:- ��һ������ **��3** ʱ���÷� **�����е����п�** ���� **�����**��
docs\GREYHARBOR_RULES_V1.md:166:- ��һ������ **��4** ʱ���÷����Ʒ��� **������**��
docs\GREYHARBOR_RULES_V1.md:167:- �����ǳ���״̬��飺ÿ�������仯��ÿҹ��ʼʱ����顣
docs\GREYHARBOR_RULES_V1.md:169:  - ���� ��3 ʱ����ĵ�λ���Է����������̣�ʹ�� `madnessPower`��
docs\GREYHARBOR_RULES_V1.md:170:  - ���� ��4 ʱ����ĵ�λ����������������̣�ʹ�� `reasonPower`��
docs\GREYHARBOR_RULES_V1.md:171:- �Ѿ��������ϵĵ�λ **����** ��Ϊ֮�������仯�����档
docs\GREYHARBOR_RULES_V1.md:175:### 3.4 ʧȥ��ظ�����
docs\GREYHARBOR_RULES_V1.md:177:- ��ʧȥ X ����������ֱ�Ӽ��� X����� 0��
docs\GREYHARBOR_RULES_V1.md:178:- ���ظ� X �������������� X����� 6��
docs\GREYHARBOR_RULES_V1.md:179:- �������ɡ���Ԩ���񡢸�������ɵ�ʧȥ���� **���Ǵ���**�������ü���Ч�����١�
docs\GREYHARBOR_RULES_V1.md:180:- ͬһЧ�������ڵĶ��ʧȥ/�ظ���ȫ��Ӧ�ã��ټ���������㡣
docs\GREYHARBOR_RULES_V1.md:181:- ����������ʱ�㣺
docs\GREYHARBOR_RULES_V1.md:185:- �����ʱ����Ϊ 0���÷������и���˫��ͬʱΪ 0 ��ƽ�֡�
docs\GREYHARBOR_RULES_V1.md:187:### 3.5 ������ҹʤ
docs\GREYHARBOR_RULES_V1.md:189:- ������ֱ��ת��Ϊҹ�֡�
docs\GREYHARBOR_RULES_V1.md:190:- ҹ����ͬʱ��ʣ����������Ӯ�ø�ҹ���� ��1.3����
docs\GREYHARBOR_RULES_V1.md:191:- �����ͻ����������ս������Ҳ��ƽ������и������� v1 �ĺ��ķ���/�����ᡣ
docs\GREYHARBOR_RULES_V1.md:203:| �ξ� | `dream` | 3 | ��ս������/���أ�׼������ |
docs\GREYHARBOR_RULES_V1.md:224:- `dream`��ֻ�ܷ��ξ������� ��4.4 �ξ�׼�����ƣ���
docs\GREYHARBOR_RULES_V1.md:225:- `any`���ɷ��ֳ�/�����������ξ������� ��4.4��
docs\GREYHARBOR_RULES_V1.md:228:### 4.4 �ξ�׼�����ƣ�v1 �ö���
docs\GREYHARBOR_RULES_V1.md:230:�ξ����ǿ��ŵص㡣ֻ������������԰ѵ�λ�����ξ���
docs\GREYHARBOR_RULES_V1.md:232:1. �õ�λ `location = dream`���ξ�ԭ�������������λ/ÿҹ���ޣ�
docs\GREYHARBOR_RULES_V1.md:234:3. �ɿ���Ч����ȷ����/�ƶ����ξ���
docs\GREYHARBOR_RULES_V1.md:238:- �ξ�ԭ���Ҳ��������ء��ĵ�λ������Ǳ�ߡ���˯֮��������������롣
docs\GREYHARBOR_RULES_V1.md:239:- �ξ�ԭ���Ҵ������ء��ĵ�λ����¶��櫡������ߣ����� **���ƽ���**��
docs\GREYHARBOR_RULES_V1.md:240:- `location = any` �����������ء��ĵ�λ����Ҷ����������������ξ���
docs\GREYHARBOR_RULES_V1.md:241:- ÿ��ÿҹͨ���������ƴ���������ξ��ĵ�λ��� **2 ��**����Ч������Ĳ��ƴ����ޡ�
docs\GREYHARBOR_RULES_V1.md:242:- ��ʽ/�¼����ξ�ΪĿ��ʱ��ռ��λ��λ��Ҳ������ 2 �����ޡ�
$ Get-Content docs/GREYHARBOR_RULES_V1.md -TotalCount 120
# ���Ҹ���ҹ������淶 �� v1.0

> ״̬��**v1 ���򶳽��**�����ݲ㡢���桢AI��UI�����Ծ��Ա��ļ�ΪΨһ������ʵԴ��
> ���÷�Χ��`card-table-v1.csv` �� 30 �ſ���society / cult ����Ӫ��neutral ��������
> ���ļ��еġ��ö�����ʾ�������ı��������壬v1 ���ô˽��Ͳ�����ȫ��һ�¡�

---

## Ŀ¼

1. �Ծ�����
2. ���顢�����뻻��
3. ����ϵͳ
4. ���ص�������
5. ��������������
6. �����ؼ���
7. ��Ӫ����
8. ����������
9. ȫ�ֽ���˳��
10. Ԥ������
11. ���Ʋö���
12. �����ֶ�����ƿھ�

---

## 1. �Ծ�����

- ˫�˶�ս����ң�P0���� AI��P1����˫��ʹ��ͬһ�׹���
- ��Ӫ��`society`��ѧ�ᣩ�� `cult`�����ţ���`neutral`�����������ɱ�˫��ʹ�á�
- һ����������� **��ҹ** ��ɣ�**��Ӯ��ҹ�߻�ʤ**����ҹ��ʤ����
- ÿҹ����ʱ�Ƚ�˫���� **ҹ��**��Night Score����ҹ�ָ���Ӯ�¸�ҹ���ȵ� 2 ��ҹʤ��һ������Ӯ�ñ�����
- ˫������ӵ�� **���ǣ�Sanity��**����ʼ **6 ��**������ 6������ 0�����ǹ����һ�������и���
- �����������ص㣺**�ֳ���scene��**��**������archive��**��**�ξ���dream��**����λ�ڵص��г������ڣ�ҹ��֮�� **���峡**��
- ÿ�ŵ�λ/������ **������** �� **�����** ����ս�������������� ��3 ʱ��������棻�����ÿ�����̶�������֮�����Ǳ仯����ת��
- v1 **����������**�����ֻ��ʹ�ùٷ�Ԥ�����飻Ԥ������Ϊ 20 �Ź̶��б����� 1 �����䣩��

### 1.1 ʤ�����������ȼ�

������һ��������������������

1. **���ǹ���**��һ�����ǽ��� 0���÷������и���
2. **��ҹʤ**��һ���Ȼ�� 2 ��ҹʤ���÷�������ʤ��
3. **��ҹ������δ������ʤ**���� ��1.3 ��ƽ��/ tiebreak �����ж���

���ȼ���

- ���ǹ����鷢����ÿ������/����Ч�� **��ȫ����֮��**��ҹ�ֽ���֮ǰ��
- ��ͬһ���ν����˫������ͬʱΪ 0���� **ƽ��**��
- ��һ����ͬһҹ�Ȼ��õ� 2 ��ҹʤ������Ч�����ǹ��㣬**���ǹ�������**���÷��и���

### 1.2 ҹ�֣�Night Score��

ҹ�� = �����������ص������� **���泯��** ��λ�ĵ�ǰս��֮�ͣ�������������Щ��λ����Ч�ӳɣ���ȥ��Ч���档

- ������ƣ����ƣ��ڷ���ǰս���� 0 �ƣ����ṩ�⻷��
- �ص㿨��װ�������¼�������ʽ��������������������ҹ�֡�
- װ���ṩ��ս���ӵ�������λ�ϡ�
- ҹ�����Ϊ 0�������ָ��֡�
- ҹ�ֲ�������ֵ����ֻ��ÿҹ����ʱ�Ƚ�һ�Ρ�

### 1.3 ҹʤ��ƽҹ

ÿҹ������

1. ҹ�ָ���Ӯ�ø�ҹ����� 1 ��ҹʤ��
2. ҹ����ͬ���Ƚ�˫�� **ʣ������**������Ӯ�ø�ҹ��
3. ����Ҳ��ͬ����ҹΪ **ƽҹ**��˫���������ҹʤ��
4. ��ĳ���ﵽ 2 ��ҹʤ����������������

��ҹ������δ���˴ﵽ 2 ��ҹʤʱ�����αȽϣ�

1. ҹʤ�������߻�ʤ��
2. ��ҹҹ���ܺ͸����߻�ʤ��
3. �������Ǹ����߻�ʤ��
4. ����ͬ����ƽ�֡�

> ע�⣺ƽҹ�����ش���ҹ��Ӳ���ޡ�

### 1.4 ҹ��֮���״̬����

����״̬ **��ҹ����**��

- ���ϵ�λ���ص㿨��װ�������丽����ϵ��
- ��λ�ĵ�ǰ�棨������/����棩������ս��������������ǡ�
- ˫�����ǡ��ƶѡ����ơ���ͨ���ƶѡ���Ԩ���ƶѡ�
- ��ʹ�õ�����������������ÿҹ�����ã�����ҹ�ۼơ�

����״̬ **��ҹ���߽����**��

- ����ҹ���ӳɵ���ʱս����ҹ�ֽ�����������
- ��������ҹ�ֽ���������ͨ���ƶѣ���
- ��ӡ������һҹ��ʼʱ���ڣ���
- ÿҹһ�εļ��������似����ͼ��ݼ��ѡ������״��׼��ȣ���

---

## 2. ���顢�����뻻��

### 2.1 Ԥ�������ģ��v1 ������

- ÿ��Ԥ������ **20 ��**��
  - **1 ������**��
  - **19 �ŷ�������**��
- ���� **8 ��**���� 19 �ŷ��������г�ȡ�����䲻�������ƣ�ʼ����Ϊ�����������ڳ��⡣
- ������� **2 ��**��ֻ����һ�Ρ�
- v1 **û��������**�����ṩ���ɹ������ղر༭�򱣴����鹦�ܡ�

### 2.2 Ԥ���������

v1 ��Ԥ�������ǹٷ��̶��б���ʹ�ö����ġ�Ԥ����������ޣ�

- ����ǡ�� 1 �š�
- ÿ�ŷ����俨��� **2 ��**��
- ֻ��ʹ�� **����Ӫ�� + ������**��
- Ԥ���б���ֱ������ CSV �� `copies` �ղ��ֶΣ�`copies` �������������δ����������
- ��ǰ 30 �ſ������ϸ� `copies` �²����Դ��� 20 �ţ�society 18��cult 19�������䣩����� v1 ��ȷ��������Ԥ��������򡣵�����ƻ��� warning ��¼�ò��졣

### 2.3 �������̣��ϸ�˳��

1. ˫��ѡ��Ԥ�����������䡣
> build · deepseek-v4.1-flash-free
→ Read docs/GREYHARBOR_RULES_V1.md [offset=120, limit=220]
> build · deepseek-v4.1-flash-free
→ Read docs/GREYHARBOR_RULES_V1.md [limit=300, offset=340]
> build · deepseek-v4.1-flash-free
→ Read docs/GREYHARBOR_RULES_V1.md [limit=200, offset=640]
> build · deepseek-v4.1-flash-free
→ Read src/engine/scoring.js 
→ Read src/engine/deck.js 
$ Get-Content src/data/card-table.normalized.json -TotalCount 60
[
  {
    "id": "harold-ashby",
    "nameZh": "���޵¡���ʲ��",
    "nameEn": "Harold Ashby",
    "faction": "society",
    "type": "leader",
    "location": null,
    "reasonPower": null,
    "madnessPower": null,
    "keywords": [],
    "sanityCost": 0,
    "copies": 1,
    "effect": "������ÿҹһ�Σ���ӡһ�ŵз���ֱ����һҹ���ظ�1����",
    "flavor": "�������˾ͻ�û��"
  },
  {
    "id": "nora-wells",
    "nameZh": "ŵ��������˹",
    "nameEn": "Nora Wells",
    "faction": "society",
    "type": "unit",
    "location": "scene",
    "reasonPower": 2,
    "madnessPower": 4,
    "keywords": [
      "����"
    ],
    "sanityCost": 0,
    "copies": 1,
    "effect": "�����볡����ʱ�鿴����һ������",
    "flavor": "��ֻ�ʼ�������˳���ļ�����Ƭ"
  },
  {
    "id": "samuel-pike",
    "nameZh": "�ɿ�ҽ��",
    "nameEn": "Dr. Samuel Pike",
    "faction": "society",
    "type": "unit",
    "location": "scene",
    "reasonPower": 4,
    "madnessPower": 4,
    "keywords": [
      "��ӡ"
    ],
    "sanityCost": 0,
    "copies": 1,
    "effect": "�볡�Ƴ�һ���з��������ӡһ��ս��4���µз���",
    "flavor": "���˲���˵��ֻ���������"
  },
  {
    "id": "edith-barrow",
    "nameZh": "����˿������",
    "nameEn": "Edith Barrow",
    "faction": "society",
    "type": "unit",
    "location": "archive",
    "reasonPower": 2,
    "madnessPower": 3,
    "keywords": [
> build · deepseek-v4.1-flash-free
$ Select-String -Path src/engine/engine.js -Pattern "function clone|viewFor|function apply|function getActions|function createGame|events" | Select-Object -First 30
src\engine\engine.js:41:  return { ok: false, error: msg, events: [] };
src\engine\engine.js:59:    this.startEvents = this.state.events.slice();
src\engine\engine.js:60:    this.state.events = [];
src\engine\engine.js:72:    copy.state.events = [];
src\engine\engine.js:92:  viewFor(pov = 0) {
src\engine\engine.js:180:    st.events = [];
src\engine\engine.js:206:    st.events = [];
src\engine\engine.js:243:      return { ok: true, events: st.events.slice() };
src\engine\engine.js:276:      events: [],
src\engine\engine.js:624:    return { ok: true, events: st.events.slice() };
src\engine\engine.js:641:      return { ok: true, events: st.events.slice() };
src\engine\engine.js:698:      return { ok: true, events: st.events.slice() };
src\engine\engine.js:722:    return { ok: true, events: st.events.slice() };
src\engine\engine.js:742:    return { ok: true, events: st.events.slice() };
src\engine\engine.js:1687:    this.state.events.push({ type, ...payload });
src\engine\engine.js:1693:    this.state.events.push({ type: 'log', text });
src\engine\engine.js:1783:export function createGame(config) {
$ Select-String -Path src/engine/engine.js -Pattern "^export function|^export const" | Select-Object -First 40
src\engine\engine.js:22:export const STARTING_HAND = 10;
src\engine\engine.js:23:export const MULLIGAN_COUNT = 2;
src\engine\engine.js:24:export const STARTING_GEMS = 2;
src\engine\engine.js:25:export const MAX_ROUNDS = 3;
src\engine\engine.js:1783:export function createGame(config) {
> build · deepseek-v4.1-flash-free
→ Read src/engine/engine.js [limit=140, offset=30]
→ Read src/engine/engine.js [limit=140, offset=1783]
> build · deepseek-v4.1-flash-free
$ node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync('src/data/card-table.normalized.json','utf8'));for(const c of d) console.log([c.id,c.faction,c.type,c.location,c.reasonPower,c.madnessPower,(c.keywords||[]).join('/'),c.sanityCost,c.copies].join('|'))"
harold-ashby|society|leader|||||0|1
nora-wells|society|unit|scene|2|4|隐秘|0|1
samuel-pike|society|unit|scene|4|4|封印|0|1
edith-barrow|society|unit|archive|2|3|连锁|0|1
walter-morse|society|unit|archive|3|6|理智反噬|0|1
lucia-vaughn|society|unit|dream|1|7|隐秘|0|1
frank-holt|society|unit|scene|5|5|连锁|0|1
arthur-pendleton|society|unit|archive|3|4|隐秘|0|1
abjuration|society|event|any||||0|1
warding-rite|society|event|row||||0|1
silver-lantern|society|equipment|attach||||0|1
old-library|society|location|archive||||0|1
elias-thorne|cult|leader|||||0|1
hooded-acolyte|cult|unit|scene|2|3|献祭|0|2
zealot|cult|unit|scene|3|6|理智反噬|0|1
sea-priestess|cult|unit|archive|4|5|腐化|0|1
gravedigger|cult|unit|archive|3|4|献祭|0|1
whisperer|cult|unit|dream|2|7|隐秘|0|1
deep-one|cult|unit|dream|5|8|理智反噬|1|1
bell-claw|cult|unit|scene|6|6|献祭|1|1
seance|cult|ritual|any||||0|1
tide-ritual|cult|ritual|dream||||0|1
lunar-eclipse|cult|environment|all||||0|1
drowned-altar|cult|location|scene||||0|1
finn-calloway|neutral|unit|any|3|4|连锁|0|1
silas-gold|neutral|unit|archive|2|3|隐秘|0|1
the-sleeper|neutral|oldgod|dream|8|12|理智反噬|2|1
thousand-eyes|neutral|oldgod|archive|7|10|封印|2|1
stormy-night|neutral|environment|all||||0|1
unexpected-aid|neutral|event|any||||0|1
> build · deepseek-v4.1-flash-free
$ node --version; npm --version
v22.23.2
10.9.8
> build · deepseek-v4.1-flash-free
规则已明确。现在开始实现 `src/engine/v2/` 下的白板引擎，先写卡牌定义与纯计分模块。
← Write src/engine/v2/cards.js
Created file successfully: src/engine/v2/cards.js
> build · deepseek-v4.1-flash-free
← Write src/engine/v2/scoring.js
Created file successfully: src/engine/v2/scoring.js
> build · deepseek-v4.1-flash-free
← Write src/engine/v2/view.js
Created file successfully: src/engine/v2/view.js
> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/view.js
Index: src/engine/v2/view.js
===================================================================
--- src/engine/v2/view.js
+++ src/engine/v2/view.js
@@ -107,7 +107,9 @@
     pending: engine.pending,
     players,
     scores: players.map((p) => p.score.total),
     events: state.events.map((event) => sanitizeEvent(event, viewer)),
-    actions: engine.getActions(viewer),
+    // A spectator must never receive action lists: mulligan actions contain
+    // hand uids, and play actions contain the current player's card ids.
+    actions: viewer === null ? [] : engine.getActions(viewer),
   };
 }

> build · deepseek-v4.1-flash-free
← Write src/engine/v2/engine.js
Created file successfully: src/engine/v2/engine.js
> build · deepseek-v4.1-flash-free
← Write src/engine/v2/index.js
Created file successfully: src/engine/v2/index.js
> build · deepseek-v4.1-flash-free
$ node -e "import('./src/engine/v2/index.js').then(({createGame,countCards})=>{const e=createGame({seed:1});console.log(e.phase,e.state.players.map(p=>[p.hand.length,p.deck.length,p.sanity,p.leaderId]));console.log('actions',e.getActions().length);let r=e.apply({type:'mulligan',player:0,uids:[]});console.log(r.ok,r.error);r=e.apply({type:'mulligan',player:1,uids:[]});console.log(r.ok,r.error,e.phase,e.night,e.current);console.log('turn actions',e.getActions().length);console.log('counts',countCards(e.state,0),countCards(e.state,1));})"
mulligan [ [ 8, 11, 6, 'harold-ashby' ], [ 8, 11, 6, 'elias-thorne' ] ]
actions 74
true undefined
true undefined play 1 0
turn actions 31
counts 19 19
> build · deepseek-v4.1-flash-free
$ node -e "import('./src/engine/v2/index.js').then(({createGame,countCards})=>{const e=createGame({seed:1});let n=0;while(e.phase!=='gameOver'&&n<500){const a=e.getActions();if(!a.length)throw new Error('no actions');const act=a[Math.floor(Math.random()*a.length)];const r=e.apply(act);if(!r.ok)throw new Error(r.error);if(countCards(e.state,0)!==19||countCards(e.state,1)!==19)throw new Error('conservation');n++;}console.log('steps',n,'result',e.result(),'night',e.night);console.log(e.state.history);})"
steps 16 result {
  winner: 1,
  reason: 'nightWins',
  night: 2,
  nightWins: [ 0, 2 ],
  sanity: [ 4, 3 ],
  decidedBy: 'score'
} night 2
[
  {
    night: 1,
    scores: [ [Object], [Object] ],
    sanityBefore: [ 6, 3 ],
    sanityAfter: [ 5, 3 ],
    winner: 1,
    tie: false,
    decidedBy: 'score',
    nightWins: [ 0, 1 ]
  },
  {
    night: 2,
    scores: [ [Object], [Object] ],
    sanityBefore: [ 5, 3 ],
    sanityAfter: [ 4, 3 ],
    winner: 1,
    tie: false,
    decidedBy: 'score',
    nightWins: [ 0, 2 ]
  }
]
> build · deepseek-v4.1-flash-free
← Write tests/v2/engine-core.test.mjs
Created file successfully: tests/v2/engine-core.test.mjs
> build · deepseek-v4.1-flash-free
← Write scripts/selfplay.mjs
Created file successfully: scripts/selfplay.mjs
> build · deepseek-v4.1-flash-free
引擎、测试和 selfplay 脚本已就绪。先运行新的 v2 测试。
$ node --test tests/v2/engine-core.test.mjs
TAP version 13
# Subtest: setup: 20-card presets, 8-card opening hands, mulligan up to 2
ok 1 - setup: 20-card presets, 8-card opening hands, mulligan up to 2
  ---
  duration_ms: 2.9938
  type: 'test'
  ...
# Subtest: same seed + same action sequence is fully deterministic
ok 2 - same seed + same action sequence is fully deterministic
  ---
  duration_ms: 5.5596
  type: 'test'
  ...
# Subtest: clone() supports speculation without polluting the original game
ok 3 - clone() supports speculation without polluting the original game
  ---
  duration_ms: 1.1429
  type: 'test'
  ...
# Subtest: viewFor hides opponent hand, deck order, and face-down identities
ok 4 - viewFor hides opponent hand, deck order, and face-down identities
  ---
  duration_ms: 1.4851
  type: 'test'
  ...
# Subtest: card count is conserved through every action (hand + deck + discard + board)
ok 5 - card count is conserved through every action (hand + deck + discard + board)
  ---
  duration_ms: 2.7864
  type: 'test'
  ...
# Subtest: scoring, night winner, and loser-goes-first rotation
ok 6 - scoring, night winner, and loser-goes-first rotation
  ---
  duration_ms: 0.7269
  type: 'test'
  ...
# Subtest: tie night: both lose 1 sanity and the previous first player keeps priority
ok 7 - tie night: both lose 1 sanity and the previous first player keeps priority
  ---
  duration_ms: 0.4007
  type: 'test'
  ...
# Subtest: sanity zero is an immediate loss; simultaneous zero is a draw
ok 8 - sanity zero is an immediate loss; simultaneous zero is a draw
  ---
  duration_ms: 0.8956
  type: 'test'
  ...
# Subtest: three nights: loser starts next night, tie keeps priority, final tiebreak resolves
ok 9 - three nights: loser starts next night, tie keeps priority, final tiebreak resolves
  ---
  duration_ms: 1.1946
  type: 'test'
  ...
# Subtest: dream only accepts cards currently on their madness face
ok 10 - dream only accepts cards currently on their madness face
  ---
  duration_ms: 0.7123
  type: 'test'
  ...
# Subtest: random legal self-play never crashes or deadlocks
ok 11 - random legal self-play never crashes or deadlocks
  ---
  duration_ms: 5.5328
  type: 'test'
  ...
1..11
# tests 11
# suites 0
# pass 11
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 139.9452
> build · deepseek-v4.1-flash-free
$ node scripts/selfplay.mjs
Greyharbor v2.1 self-play
{
  "ok": true,
  "games": 1000,
  "elapsedMs": 132,
  "avgMsPerGame": 0.132,
  "maxGameMs": 3,
  "wins": {
    "p0": 610,
    "p1": 389,
    "draw": 1
  },
  "reasons": {
    "nightWins": 865,
    "sanity": 126,
    "tiebreak": 9
  },
  "endingNight": {
    "1": 5,
    "2": 646,
    "3": 349
  },
  "totalActions": 15755,
  "avgActionsPerGame": 15.76,
  "maxActionsPerGame": 25,
  "conservation": "ok"
}
> build · deepseek-v4.1-flash-free
v2 测试 11/11 通过，selfplay 1000 局完成。现在运行全部既有测试与新测试。
$ node --test "tests/*.test.mjs" "tests/v2/*.test.mjs"
TAP version 13
# Subtest: AI vs AI：真实数据 12 局跨阵营对局，合法、可结束、步数 < 300
ok 1 - AI vs AI：真实数据 12 局跨阵营对局，合法、可结束、步数 < 300
  ---
  duration_ms: 298.3299
  type: 'test'
  ...
# Subtest: AI vs AI：同 seed 确定性（结果/步数/小局历史一致）
ok 2 - AI vs AI：同 seed 确定性（结果/步数/小局历史一致）
  ---
  duration_ms: 70.0956
  type: 'test'
  ...
# Subtest: 不得作弊：engine.state 被封死后仍可完成整局（只依赖 view + getActions/clone）
ok 3 - 不得作弊：engine.state 被封死后仍可完成整局（只依赖 view + getActions/clone）
  ---
  duration_ms: 33.4076
  type: 'test'
  ...
# Subtest: pending/mulligan：换掉低价值/重复天气，保留间谍
ok 4 - pending/mulligan：换掉低价值/重复天气，保留间谍
  ---
  duration_ms: 1.7741
  type: 'test'
  ...
# Subtest: pending/chooseFirstPlayer：松鼠党 AI 让对手先手
ok 5 - pending/chooseFirstPlayer：松鼠党 AI 让对手先手
  ---
  duration_ms: 0.8727
  type: 'test'
  ...
# Subtest: pending/medic：优先复活间谍（抽 2 = 巨大手牌资源）
ok 6 - pending/medic：优先复活间谍（抽 2 = 巨大手牌资源）
  ---
  duration_ms: 2.9229
  type: 'test'
  ...
# Subtest: pending/reviveRow：灵巧单位复活不丢牌（牌数守恒）
ok 7 - pending/reviveRow：灵巧单位复活不丢牌（牌数守恒）
  ---
  duration_ms: 2.1031
  type: 'test'
  ...
# Subtest: pending/takeGraveUnit：领袖从墓地取牌加入手牌
ok 8 - pending/takeGraveUnit：领袖从墓地取牌加入手牌
  ---
  duration_ms: 0.8734
  type: 'test'
  ...
# Subtest: pending/discardCards + deckChoice：弃 2 抽 1 流程完整
ok 9 - pending/discardCards + deckChoice：弃 2 抽 1 流程完整
  ---
  duration_ms: 1.6435
  type: 'test'
  ...
# Subtest: pending/chooseWeather：从牌堆打出天气并生效
ok 10 - pending/chooseWeather：从牌堆打出天气并生效
  ---
  duration_ms: 1.6572
  type: 'test'
  ...
# Subtest: pending/viewHand：信息类领袖能力正确应答
ok 11 - pending/viewHand：信息类领袖能力正确应答
  ---
  duration_ms: 0.8739
  type: 'test'
  ...
# Subtest: 启发式：敌方近战行 ≥10 时，hard AI 会使用单行灼烧（Villentretenmerth）
ok 12 - 启发式：敌方近战行 ≥10 时，hard AI 会使用单行灼烧（Villentretenmerth）
  ---
  duration_ms: 2.1566
  type: 'test'
  ...
# Subtest: 启发式：特殊 Scorch 会摧毁敌方最强单位
ok 13 - 启发式：特殊 Scorch 会摧毁敌方最强单位
  ---
  duration_ms: 1.7774
  type: 'test'
  ...
# Subtest: 启发式：间谍优先（抽 2 张 = 手牌资源）
ok 14 - 启发式：间谍优先（抽 2 张 = 手牌资源）
  ---
  duration_ms: 1.6289
  type: 'test'
  ...
# Subtest: 启发式：领先时 Pass、落后时继续出牌
ok 15 - 启发式：领先时 Pass、落后时继续出牌
  ---
  duration_ms: 4.5197
  type: 'test'
  ...
# Subtest: 启发式：非决胜局差距过大时战略性放弃；决胜局（自己 1 宝石）必须抢分
ok 16 - 启发式：非决胜局差距过大时战略性放弃；决胜局（自己 1 宝石）必须抢分
  ---
  duration_ms: 4.0569
  type: 'test'
  ...
# Subtest: 启发式：对手已 Pass 时，落后会追分；反超后立刻 Pass 锁定小局
ok 17 - 启发式：对手已 Pass 时，落后会追分；反超后立刻 Pass 锁定小局
  ---
  duration_ms: 0.8138
  type: 'test'
  ...
# Subtest: 启发式：领袖时机——号角领袖等己方行成型、灼烧领袖等敌方行 ≥10
ok 18 - 启发式：领袖时机——号角领袖等己方行成型、灼烧领袖等敌方行 ≥10
  ---
  duration_ms: 5.7162
  type: 'test'
  ...
# Subtest: 启发式：Decoy 会换回敌方打到我方场地的间谍（引擎支持）
ok 19 - 启发式：Decoy 会换回敌方打到我方场地的间谍（引擎支持）
  ---
  duration_ms: 5.1474
  type: 'test'
  ...
# Subtest: 性能：单次决策 normal < 20ms，hard < 60ms
ok 20 - 性能：单次决策 normal < 20ms，hard < 60ms
  ---
  duration_ms: 60.8604
  type: 'test'
  ...
# Subtest: 难度：normal 明显强于 easy；hard 强于 easy 且不弱于 normal
ok 21 - 难度：normal 明显强于 easy；hard 强于 easy 且不弱于 normal
  ---
  duration_ms: 755.6709
  type: 'test'
  ...
# Subtest: 1. 卡牌/领袖数量与阵营分布精确
ok 22 - 1. 卡牌/领袖数量与阵营分布精确
  ---
  duration_ms: 2.9887
  type: 'test'
  ...
# Subtest: 2a. id 唯一、合法 kebab-case，且与参考数据集合完全一致
ok 23 - 2a. id 唯一、合法 kebab-case，且与参考数据集合完全一致
  ---
  duration_ms: 1.0419
  type: 'test'
  ...
# Subtest: 2b. 每张卡的结构化字段与参考数据逐字段一致
ok 24 - 2b. 每张卡的结构化字段与参考数据逐字段一致
  ---
  duration_ms: 1.297
  type: 'test'
  ...
# Subtest: 2c. 每张领袖的阵营与能力结构与参考数据一致
ok 25 - 2c. 每张领袖的阵营与能力结构与参考数据一致
  ---
  duration_ms: 0.1951
  type: 'test'
  ...
# Subtest: 2d. Muster 同组按规则 §3.3 的精确写法都能解析到卡（家族 combo 不落空）
ok 26 - 2d. Muster 同组按规则 §3.3 的精确写法都能解析到卡（家族 combo 不落空）
  ---
  duration_ms: 0.5233
  type: 'test'
  ...
# Subtest: 3a. 卡牌必填字段与类型完整
ok 27 - 3a. 卡牌必填字段与类型完整
  ---
  duration_ms: 2.2184
  type: 'test'
  ...
# Subtest: 3b. 卡牌中文名不重复（避免复制粘贴错位）
ok 28 - 3b. 卡牌中文名不重复（避免复制粘贴错位）
  ---
  duration_ms: 0.4188
  type: 'test'
  ...
# Subtest: 3c. 领袖必填字段完整
ok 29 - 3c. 领袖必填字段完整
  ---
  duration_ms: 0.6042
  type: 'test'
  ...
# Subtest: 4a. 所有能力 id 均在 ability-text 中登记且形状合法
ok 30 - 4a. 所有能力 id 均在 ability-text 中登记且形状合法
  ---
  duration_ms: 1.1942
  type: 'test'
  ...
# Subtest: 4b. 每种能力用到时都能渲染出中英文案
ok 31 - 4b. 每种能力用到时都能渲染出中英文案
  ---
  duration_ms: 1.855
  type: 'test'
  ...
# Subtest: 5a. copies 与 deckable 约束合理
ok 32 - 5a. copies 与 deckable 约束合理
  ---
  duration_ms: 0.3873
  type: 'test'
  ...
# Subtest: 5b. 4 张召唤衍生物齐全且不可入组
ok 33 - 5b. 4 张召唤衍生物齐全且不可入组
  ---
  duration_ms: 0.2799
  type: 'test'
  ...
# Subtest: 6a. abilityZh / abilityEn 与结构化 abilities 完全一致
ok 34 - 6a. abilityZh / abilityEn 与结构化 abilities 完全一致
  ---
  duration_ms: 0.552
  type: 'test'
  ...
# Subtest: 6b. 领袖 abilityZh 与结构化能力一致，中文引语齐全
ok 35 - 6b. 领袖 abilityZh 与结构化能力一致，中文引语齐全
  ---
  duration_ms: 0.1404
  type: 'test'
  ...
# Subtest: 6c. 中文名/风味文案无明显空值或英文残留
ok 36 - 6c. 中文名/风味文案无明显空值或英文残留
  ---
  duration_ms: 0.1431
  type: 'test'
  ...
# Subtest: 7. art { motif, palette, seed } 合法且 seed 稳定
ok 37 - 7. art { motif, palette, seed } 合法且 seed 稳定
  ---
  duration_ms: 0.3139
  type: 'test'
  ...
# Subtest: 8a. factions 数据完整（5 阵营 + neutral）
ok 38 - 8a. factions 数据完整（5 阵营 + neutral）
  ---
  duration_ms: 0.3111
  type: 'test'
  ...
# Subtest: 8b. ability-text 每项都有中文名/说明/图标与英文
ok 39 - 8b. ability-text 每项都有中文名/说明/图标与英文
  ---
  duration_ms: 0.3662
  type: 'test'
  ...
# Subtest: 9a. getCard / getLeader / getFaction 查询
ok 40 - 9a. getCard / getLeader / getFaction 查询
  ---
  duration_ms: 0.0941
  type: 'test'
  ...
# Subtest: 9b. CARDS_BY_FACTION 与 collectionFor 正确
ok 41 - 9b. CARDS_BY_FACTION 与 collectionFor 正确
  ---
  duration_ms: 0.5162
  type: 'test'
  ...
# Subtest: 10a. 全部预设牌组通过 validateDeck
ok 42 - 10a. 全部预设牌组通过 validateDeck
  ---
  duration_ms: 1.3314
  type: 'test'
  ...
# Subtest: 10b. validateDeck 拒绝非法牌组（错误信息可读）
ok 43 - 10b. validateDeck 拒绝非法牌组（错误信息可读）
  ---
  duration_ms: 0.4323
  type: 'test'
  ...
# Subtest: 10c. 预设牌组的强度统计合理（可作 AI 参考）
ok 44 - 10c. 预设牌组的强度统计合理（可作 AI 参考）
  ---
  duration_ms: 0.447
  type: 'test'
  ...
# Subtest: oracle: 163 张卡 / 22 领袖 / 5 阵营，id 唯一且 kebab-case
ok 45 - oracle: 163 张卡 / 22 领袖 / 5 阵营，id 唯一且 kebab-case
  ---
  duration_ms: 2.0073
  type: 'test'
  ...
# Subtest: oracle: 4 张衍生物 copies=0/deckable=false；召唤/变身目标均存在
ok 46 - oracle: 4 张衍生物 copies=0/deckable=false；召唤/变身目标均存在
  ---
  duration_ms: 0.6301
  type: 'test'
  ...
# Subtest: cards: 163 张、id 集合与参考完全一致、无重复、kebab-case
ok 47 - cards: 163 张、id 集合与参考完全一致、无重复、kebab-case
  ---
  duration_ms: 0.5155
  type: 'test'
  ...
# Subtest: cards: 每张卡 faction/type/hero/rows/strength/copies/deckable 与参考逐字段一致
ok 48 - cards: 每张卡 faction/type/hero/rows/strength/copies/deckable 与参考逐字段一致
  ---
  duration_ms: 1.0803
  type: 'test'
  ...
# Subtest: cards: abilities 与参考深比较（忽略中文/附加字段/数组顺序）
ok 49 - cards: abilities 与参考深比较（忽略中文/附加字段/数组顺序）
  ---
  duration_ms: 0.6219
  type: 'test'
  ...
# Subtest: cards: 结构不变量（行/力量/能力引用/中文文案/衍生物）
ok 50 - cards: 结构不变量（行/力量/能力引用/中文文案/衍生物）
  ---
  duration_ms: 0.5959
  type: 'test'
  ...
# Subtest: leaders: 22 张、id 集合/阵营/ability 与参考一致
ok 51 - leaders: 22 张、id 集合/阵营/ability 与参考一致
  ---
  duration_ms: 0.4981
  type: 'test'
  ...
# Subtest: factions: 5 阵营 + neutral，能力 id 与参考一致
ok 52 - factions: 5 阵营 + neutral，能力 id 与参考一致
  ---
  duration_ms: 0.161
  type: 'test'
  ...
# Subtest: db: collectionFor = 本阵营 + 中立（deckable 且 copies>0）
ok 53 - db: collectionFor = 本阵营 + 中立（deckable 且 copies>0）
  ---
  duration_ms: 0.9461
  type: 'test'
  ...
# Subtest: presets: 每阵营 ≥1 套，独立计数满足牌组规则（单位≥22、特殊≤10、数量≤copies、仅本阵营+中立）
ok 54 - presets: 每阵营 ≥1 套，独立计数满足牌组规则（单位≥22、特殊≤10、数量≤copies、仅本阵营+中立）
  ---
  duration_ms: 2.2608
  type: 'test'
  ...
# Subtest: muster: 每个 group 至少能解析到 1 张可收藏卡（Arachas 不得误吃 Behemoth）
ok 55 - muster: 每个 group 至少能解析到 1 张可收藏卡（Arachas 不得误吃 Behemoth）
  ---
  duration_ms: 3.3009
  type: 'test'
  ...
# Subtest: E2E smoke：首页可加载 + 1280×800/1920×1080 截图 + console 报告
ok 56 - E2E smoke：首页可加载 + 1280×800/1920×1080 截图 + console 报告 # SKIP SKIP：设置 E2E=1 运行（UI 可测后；scripts/e2e.mjs --mode=smoke）
  ---
  duration_ms: 1.2196
  type: 'test'
  ...
# Subtest: E2E full：首页→选阵营→预设开局→换牌→出牌→Pass→AI 回合→小局结束→比赛结束
ok 57 - E2E full：首页→选阵营→预设开局→换牌→出牌→Pass→AI 回合→小局结束→比赛结束 # SKIP SKIP：设置 E2E_FULL=1 运行（UI 就绪后；scripts/e2e.mjs 约 1~3 分钟）
  ---
  duration_ms: 0.1315
  type: 'test'
  ...
# Subtest: setup: draws 10, mulligan phase, then round 1
ok 58 - setup: draws 10, mulligan phase, then round 1
  ---
  duration_ms: 2.739
  type: 'test'
  ...
# Subtest: mulligan: redraws chosen count and keeps hand size
ok 59 - mulligan: redraws chosen count and keeps hand size
  ---
  duration_ms: 0.4626
  type: 'test'
  ...
# Subtest: turn alternates and both passes end the round
ok 60 - turn alternates and both passes end the round
  ---
  duration_ms: 2.2774
  type: 'test'
  ...
# Subtest: empty hand auto-passes
ok 61 - empty hand auto-passes
  ---
  duration_ms: 0.5142
  type: 'test'
  ...
# Subtest: faction ability: nilfgaard wins ties
ok 62 - faction ability: nilfgaard wins ties
  ---
  duration_ms: 1.1574
  type: 'test'
  ...
# Subtest: non-nilf tie costs both a gem
ok 63 - non-nilf tie costs both a gem
  ---
  duration_ms: 0.3774
  type: 'test'
  ...
# Subtest: northern realms draws on round win
ok 64 - northern realms draws on round win
  ---
  duration_ms: 0.5292
  type: 'test'
  ...
# Subtest: monsters keep a unit after the round
ok 65 - monsters keep a unit after the round
  ---
  duration_ms: 1.182
  type: 'test'
  ...
# Subtest: skellige revives 2 units at the start of round 3
ok 66 - skellige revives 2 units at the start of round 3
  ---
  duration_ms: 1.7425
  type: 'test'
  ...
# Subtest: scoia'tael chooses who starts
ok 67 - scoia'tael chooses who starts
  ---
  duration_ms: 0.4872
  type: 'test'
  ...
# Subtest: clone() keeps engine deterministic and independent
ok 68 - clone() keeps engine deterministic and independent
  ---
  duration_ms: 0.8184
  type: 'test'
  ...
# Subtest: tight bond: multiplier by same-name copies in the same row
ok 69 - tight bond: multiplier by same-name copies in the same row
  ---
  duration_ms: 0.4092
  type: 'test'
  ...
# Subtest: weather + tight bond + horn: 1 x copies x2
ok 70 - weather + tight bond + horn: 1 x copies x2
  ---
  duration_ms: 0.5694
  type: 'test'
  ...
# Subtest: morale adds +1 after bond, horn doubles after morale
ok 71 - morale adds +1 after bond, horn doubles after morale
  ---
  duration_ms: 0.4708
  type: 'test'
  ...
# Subtest: horn unit does not double itself but doubles the row
ok 72 - horn unit does not double itself but doubles the row
  ---
  duration_ms: 0.2898
  type: 'test'
  ...
# Subtest: heroes are immune to weather, horn, morale and decoy
ok 73 - heroes are immune to weather, horn, morale and decoy
  ---
  duration_ms: 0.4479
  type: 'test'
  ...
# Subtest: scorch destroys all strongest non-hero units on both sides
ok 74 - scorch destroys all strongest non-hero units on both sides
  ---
  duration_ms: 0.5934
  type: 'test'
  ...
# Subtest: row scorch only triggers if enemy row total >= 10
ok 75 - row scorch only triggers if enemy row total >= 10
  ---
  duration_ms: 0.8603
  type: 'test'
  ...
# Subtest: spy goes to the opponent board and draws 2 cards
ok 76 - spy goes to the opponent board and draws 2 cards
  ---
  duration_ms: 0.3167
  type: 'test'
  ...
# Subtest: medic revives a non-hero unit from the graveyard
ok 77 - medic revives a non-hero unit from the graveyard
  ---
  duration_ms: 0.5906
  type: 'test'
  ...
# Subtest: medic revive of an agile unit keeps the card (reviveRow)
ok 78 - medic revive of an agile unit keeps the card (reviveRow)
  ---
  duration_ms: 0.513
  type: 'test'
  ...
# Subtest: muster pulls all same-group cards from the deck
ok 79 - muster pulls all same-group cards from the deck
  ---
  duration_ms: 0.7584
  type: 'test'
  ...
# Subtest: muster: same-name copies in deck are summoned (Arachas x3)
ok 80 - muster: same-name copies in deck are summoned (Arachas x3)
  ---
  duration_ms: 0.3652
  type: 'test'
  ...
# Subtest: muster: family group with colon names (Crones)
ok 81 - muster: family group with colon names (Crones)
  ---
  duration_ms: 0.2918
  type: 'test'
  ...
# Subtest: muster: Gaunter O'Dimm summons Darkness copies
ok 82 - muster: Gaunter O'Dimm summons Darkness copies
  ---
  duration_ms: 0.4389
  type: 'test'
  ...
# Subtest: muster with explicit group (Arachas Behemoth summons Arachas)
ok 83 - muster with explicit group (Arachas Behemoth summons Arachas)
  ---
  duration_ms: 0.5623
  type: 'test'
  ...
# Subtest: decoy returns a unit to hand and leaves a 0-power placeholder
ok 84 - decoy returns a unit to hand and leaves a 0-power placeholder
  ---
  duration_ms: 0.3147
  type: 'test'
  ...
# Subtest: avenger: cow removed by decoy summons bovine defense force
ok 85 - avenger: cow removed by decoy summons bovine defense force
  ---
  duration_ms: 0.3172
  type: 'test'
  ...
# Subtest: berserker transforms under mardroeme aura
ok 86 - berserker transforms under mardroeme aura
  ---
  duration_ms: 0.374
  type: 'test'
  ...
# Subtest: weather card: frost forces close combat units to 1; clear weather removes it
ok 87 - weather card: frost forces close combat units to 1; clear weather removes it
  ---
  duration_ms: 0.4529
  type: 'test'
  ...
# Subtest: duplicate weather is wasted
ok 88 - duplicate weather is wasted
  ---
  duration_ms: 0.203
  type: 'test'
  ...
# Subtest: horn special can not be stacked on the same row
ok 89 - horn special can not be stacked on the same row
  ---
  duration_ms: 0.1862
  type: 'test'
  ...
# Subtest: King Bran: units lose half strength (rounded down), never below 1
ok 90 - King Bran: units lose half strength (rounded down), never below 1
  ---
  duration_ms: 0.3333
  type: 'test'
  ...
# Subtest: Skellige round-3 revive excludes heroes
ok 91 - Skellige round-3 revive excludes heroes
  ---
  duration_ms: 0.3369
  type: 'test'
  ...
# Subtest: decoy steals an enemy spy on your battlefield into your hand
ok 92 - decoy steals an enemy spy on your battlefield into your hand
  ---
  duration_ms: 0.2764
  type: 'test'
  ...
# Subtest: leader graveyard abilities can take special cards
ok 93 - leader graveyard abilities can take special cards
  ---
  duration_ms: 0.6168
  type: 'test'
  ...
# Subtest: avenger token does not change the just-finished round score (scores freeze)
ok 94 - avenger token does not change the just-finished round score (scores freeze)
  ---
  duration_ms: 0.6708
  type: 'test'
  ...
# Subtest: leader: play weather from deck
ok 95 - leader: play weather from deck
  ---
  duration_ms: 0.3522
  type: 'test'
  ...
# Subtest: leader: horn row
ok 96 - leader: horn row
  ---
  duration_ms: 0.1939
  type: 'test'
  ...
# Subtest: leader: scorch row
ok 97 - leader: scorch row
  ---
  duration_ms: 0.2316
  type: 'test'
  ...
# Subtest: leader: take unit from own graveyard to hand
ok 98 - leader: take unit from own graveyard to hand
  ---
  duration_ms: 0.2319
  type: 'test'
  ...
# Subtest: leader: discard 2 then draw 1 from deck
ok 99 - leader: discard 2 then draw 1 from deck
  ---
  duration_ms: 0.4507
  type: 'test'
  ...
# Subtest: leader: white flame cancels opponent leader
ok 100 - leader: white flame cancels opponent leader
  ---
  duration_ms: 0.1468
  type: 'test'
  ...
# Subtest: leader: passive double spy power
ok 101 - leader: passive double spy power
  ---
  duration_ms: 0.166
  type: 'test'
  ...
# Subtest: leader: passive king bran halves weather loss
ok 102 - leader: passive king bran halves weather loss
  ---
  duration_ms: 0.2074
  type: 'test'
  ...
# Subtest: leader: passive extra opening draw
ok 103 - leader: passive extra opening draw
  ---
  duration_ms: 0.1255
  type: 'test'
  ...
# Subtest: validateDeck: legal deck
ok 104 - validateDeck: legal deck
  ---
  duration_ms: 0.2425
  type: 'test'
  ...
# Subtest: validateDeck: rejects too few units / too many specials / wrong faction
ok 105 - validateDeck: rejects too few units / too many specials / wrong faction
  ---
  duration_ms: 0.2544
  type: 'test'
  ...
# Subtest: random playout terminates without errors
ok 106 - random playout terminates without errors
  ---
  duration_ms: 9.5964
  type: 'test'
  ...
# Subtest: setup: 20-card presets, 8-card opening hands, mulligan up to 2
ok 107 - setup: 20-card presets, 8-card opening hands, mulligan up to 2
  ---
  duration_ms: 4.8119
  type: 'test'
  ...
# Subtest: same seed + same action sequence is fully deterministic
ok 108 - same seed + same action sequence is fully deterministic
  ---
  duration_ms: 7.1099
  type: 'test'
  ...
# Subtest: clone() supports speculation without polluting the original game
ok 109 - clone() supports speculation without polluting the original game
  ---
  duration_ms: 1.8153
  type: 'test'
  ...
# Subtest: viewFor hides opponent hand, deck order, and face-down identities
ok 110 - viewFor hides opponent hand, deck order, and face-down identities
  ---
  duration_ms: 1.4856
  type: 'test'
  ...
# Subtest: card count is conserved through every action (hand + deck + discard + board)
ok 111 - card count is conserved through every action (hand + deck + discard + board)
  ---
  duration_ms: 3.6744
  type: 'test'
  ...
# Subtest: scoring, night winner, and loser-goes-first rotation
ok 112 - scoring, night winner, and loser-goes-first rotation
  ---
  duration_ms: 0.567
  type: 'test'
  ...
# Subtest: tie night: both lose 1 sanity and the previous first player keeps priority
ok 113 - tie night: both lose 1 sanity and the previous first player keeps priority
  ---
  duration_ms: 0.357
  type: 'test'
  ...
# Subtest: sanity zero is an immediate loss; simultaneous zero is a draw
ok 114 - sanity zero is an immediate loss; simultaneous zero is a draw
  ---
  duration_ms: 0.4638
  type: 'test'
  ...
# Subtest: three nights: loser starts next night, tie keeps priority, final tiebreak resolves
ok 115 - three nights: loser starts next night, tie keeps priority, final tiebreak resolves
  ---
  duration_ms: 1.2109
  type: 'test'
  ...
# Subtest: dream only accepts cards currently on their madness face
ok 116 - dream only accepts cards currently on their madness face
  ---
  duration_ms: 0.7795
  type: 'test'
  ...
# Subtest: random legal self-play never crashes or deadlocks
ok 117 - random legal self-play never crashes or deadlocks
  ---
  duration_ms: 5.6213
  type: 'test'
  ...
1..117
# tests 117
# suites 0
# pass 115
# fail 0
# cancelled 0
# skipped 2
# todo 0
# duration_ms 1407.7725
> build · deepseek-v4.1-flash-free
全部测试通过（115 通过，2 个既有 E2E 跳过）。我做一次最终核对：文件清单、约束检查与 selfplay 复跑。
$ Get-ChildItem src/engine/v2, tests/v2 | Select-Object FullName,Length; Get-Item scripts/selfplay.mjs | Select-Object FullName,Length
FullName                                          Length
--------                                          ------
D:\Games\greyharbor\src\engine\v2\cards.js          5766
D:\Games\greyharbor\src\engine\v2\engine.js        24185
D:\Games\greyharbor\src\engine\v2\index.js           479
D:\Games\greyharbor\src\engine\v2\scoring.js        3508
D:\Games\greyharbor\src\engine\v2\view.js           3447
D:\Games\greyharbor\tests\v2\engine-core.test.mjs  18724
D:\Games\greyharbor\scripts\selfplay.mjs            3524
$ node scripts/selfplay.mjs --games=1000
Greyharbor v2.1 self-play
{
  "ok": true,
  "games": 1000,
  "elapsedMs": 120,
  "avgMsPerGame": 0.12,
  "maxGameMs": 2,
  "wins": {
    "p0": 610,
    "p1": 389,
    "draw": 1
  },
  "reasons": {
    "nightWins": 865,
    "sanity": 126,
    "tiebreak": 9
  },
  "endingNight": {
    "1": 5,
    "2": 646,
    "3": 349
  },
  "totalActions": 15755,
  "avgActionsPerGame": 15.76,
  "maxActionsPerGame": 25,
  "conservation": "ok"
}
> build · deepseek-v4.1-flash-free
$ Get-Item src/engine/engine.js, src/engine/ai.js, src/engine/scoring.js, src/engine/deck.js, src/engine/rng.js, src/app.js, index.html | Select-Object Name,LastWriteTime
Name       LastWriteTime
----       -------------
engine.js  2026/10/17 8:32:58
ai.js      2026/10/17 8:32:58
scoring.js 2026/10/17 8:32:58
deck.js    2026/10/17 8:32:58
rng.js     2026/10/17 8:32:58
app.js     2026/10/17 8:32:58
index.html 2026/10/17 8:32:58
> build · deepseek-v4.1-flash-free
← Edit src/engine/v2/engine.js
Index: src/engine/v2/engine.js
===================================================================
--- src/engine/v2/engine.js
+++ src/engine/v2/engine.js
@@ -18,9 +18,8 @@
 import {
   LOCATIONS,
   LOCATION_CAPACITY,
   LOCATION_LABELS,
-  SANITY_MAX,
   SANITY_MIN,
   clampSanity,
   countCards,
   faceForSanity,

> build · deepseek-v4.1-flash-free
$ node --test "tests/v2/*.test.mjs"
TAP version 13
# Subtest: setup: 20-card presets, 8-card opening hands, mulligan up to 2
ok 1 - setup: 20-card presets, 8-card opening hands, mulligan up to 2
  ---
  duration_ms: 2.6755
  type: 'test'
  ...
# Subtest: same seed + same action sequence is fully deterministic
ok 2 - same seed + same action sequence is fully deterministic
  ---
  duration_ms: 5.446
  type: 'test'
  ...
# Subtest: clone() supports speculation without polluting the original game
ok 3 - clone() supports speculation without polluting the original game
  ---
  duration_ms: 1.0508
  type: 'test'
  ...
# Subtest: viewFor hides opponent hand, deck order, and face-down identities
ok 4 - viewFor hides opponent hand, deck order, and face-down identities
  ---
  duration_ms: 1.6975
  type: 'test'
  ...
# Subtest: card count is conserved through every action (hand + deck + discard + board)
ok 5 - card count is conserved through every action (hand + deck + discard + board)
  ---
  duration_ms: 2.765
  type: 'test'
  ...
# Subtest: scoring, night winner, and loser-goes-first rotation
ok 6 - scoring, night winner, and loser-goes-first rotation
  ---
  duration_ms: 0.4404
  type: 'test'
  ...
# Subtest: tie night: both lose 1 sanity and the previous first player keeps priority
ok 7 - tie night: both lose 1 sanity and the previous first player keeps priority
  ---
  duration_ms: 0.2974
  type: 'test'
  ...
# Subtest: sanity zero is an immediate loss; simultaneous zero is a draw
ok 8 - sanity zero is an immediate loss; simultaneous zero is a draw
  ---
  duration_ms: 0.4084
  type: 'test'
  ...
# Subtest: three nights: loser starts next night, tie keeps priority, final tiebreak resolves
ok 9 - three nights: loser starts next night, tie keeps priority, final tiebreak resolves
  ---
  duration_ms: 1.0724
  type: 'test'
  ...
# Subtest: dream only accepts cards currently on their madness face
ok 10 - dream only accepts cards currently on their madness face
  ---
  duration_ms: 0.6774
  type: 'test'
  ...
# Subtest: random legal self-play never crashes or deadlocks
ok 11 - random legal self-play never crashes or deadlocks
  ---
  duration_ms: 5.8172
  type: 'test'
  ...
1..11
# tests 11
# suites 0
# pass 11
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 132.1964
> build · deepseek-v4.1-flash-free
$ node --test "tests/*.test.mjs" "tests/v2/*.test.mjs" 2>&1 | Select-String -Pattern "^# (tests|pass|fail|skipped|cancelled|todo)"
# tests 117
# pass 115
# fail 0
# cancelled 0
# skipped 2
# todo 0
> build · deepseek-v4.1-flash-free
阶段 2.1 白板引擎已完成，未修改任何旧引擎/UI/数据文件。

## 实现内容

**新增 `src/engine/v2/`**
- `cards.js`：30 张 v1 卡牌静态数据 + 学会/教团两套 20 张预设牌组（1 领袖 + 19 非领袖）。
- `scoring.js`：地点常量、理智/翻面、白板战力、夜分、牌数守恒等纯函数。
- `view.js`：`viewFor(pov)` 视角裁剪；隐藏对手手牌、牌堆顺序、盖牌身份，并清洗事件流。
- `engine.js`：确定性引擎主体，复用 `src/engine/rng.js` 的 `hashSeed / randInt / shuffle`。
- `index.js`：统一导出。

**已覆盖规则**
- 起手 8 张、换牌至多 2 张并洗回补抽。
- 理智初始 6；`≤3` 时手牌强制翻到疯狂面；夜败方 -1，平夜双方 -1；归零立即判负，双方归零平局。
- 三地点 `scene/archive/dream`，槽位 5/5/3；梦境只接受当前疯狂面卡牌；支持隐秘盖牌与夜末统一翻开。
- 回合出牌/Pass、对手已 Pass 时可连续行动、无合法动作自动 Pass。
- 三夜两胜；夜分相同先比剩余理智；三夜未分胜负按夜胜数 → 总夜分 → 理智 → 平局裁定。
- `clone()` 独立推演；`apply()` 返回事件流；`getActions()` 生成合法动作。
- 单位能力全部白板，只按锁定面的 `reasonPower/madnessPower` 计分；非单位牌本阶段不产生效果。

## 测试结果

命令：
```powershell
node --test "tests/*.test.mjs" "tests/v2/*.test.mjs"
```

结果：
- **117 个测试，115 通过，0 失败，2 跳过**
- 跳过的 2 个为既有 E2E smoke/full（需要 `E2E=1` / `E2E_FULL=1`）
- 新增 `tests/v2/engine-core.test.mjs`：**11/11 通过**

覆盖：开局/换牌、夜切换、计分、理智归零、两夜胜出、平夜裁定、三夜 tiebreak、同种子确定性、`clone()` 不污染原局、`viewFor` 信息隐藏、牌数守恒、随机合法动作自对弈。

## Selfplay 结果

命令：
```powershell
node scripts/selfplay.mjs --games=1000
```

结果：
- 1000 局全部完成，**120ms**，无崩溃、无死锁、无超时
- 胜负：P0 **610** / P1 **389** / 平局 **1**
- 结束原因：`nightWins` 865、`sanity` 126、`tiebreak` 9
- 结束夜次：第 1 夜 5、第 2 夜 646、第 3 夜 349
- 总动作数 15,755，平均 15.76，单局最多 25
- 牌数守恒检查：`ok`

## 新文件清单

```text
src/engine/v2/cards.js
src/engine/v2/scoring.js
src/engine/v2/view.js
src/engine/v2/engine.js
src/engine/v2/index.js
tests/v2/engine-core.test.mjs
scripts/selfplay.mjs
```

旧文件 `src/engine/engine.js`、`ai.js`、`scoring.js`、`deck.js`、`rng.js` 以及 `src/ui`、`src/app.js`、`src/data`、`index.html` 均未改动。
