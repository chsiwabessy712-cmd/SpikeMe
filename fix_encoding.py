import sys

filepath = r'c:\thelab\template\jf1_7.html'
data = open(filepath, 'rb').read()
text = data.decode('utf-8', errors='replace')
lines = text.split('\n')

fixes = {
    53: '        <h1>\U0001f916 Multiplication vs Division</h1>\r',
    55: '            \u201cMultiplication helps robots and programs repeat actions and make totals.<br>\r',
    61: '                \U0001f31f Learning Goals\r',
    70: '                    <h3 style="color: white;">\u00d7 Multiplication example</h3>\r',
    73: '                            \u25ab\ufe0f Combines equal groups<br>\r',
    74: '                            \u25ab\ufe0f Makes bigger amounts<br>\r',
    75: '                            \u25ab\ufe0f How many altogether?\r',
    84: '                    <h3 style="color: white;">\u00f7 Division example</h3>\r',
    87: '                            \u25ab\ufe0f Splits into equal groups<br>\r',
    88: '                            \u25ab\ufe0f Breaks into smaller parts<br>\r',
    89: '                            \u25ab\ufe0f How many in each group?\r',
    101: '            <h2>\U0001f9e9 Coding Thinking Connection</h2>\r',
    150: '        <h1 style="color: #5a4fcf; margin-top: 0;">\U0001f3af Monster Splash \u2013 Math Shooting Game</h1>\r',
    152: '            Use <b>Arrow Keys</b> to move your hero \U0001f9d1\u200d\U0001f680 around the arena. Find monsters \U0001f47e and answer\r',
    153: '            <b>multiplication</b> or <b>division</b> questions to shoot them with \U0001f4a7 water bullets!\r',
}

for idx, replacement in fixes.items():
    lines[idx] = replacement

result = '\n'.join(lines)
with open(filepath, 'w', encoding='utf-8', newline='') as f:
    f.write(result)

print(f'Done - fixed {len(fixes)} lines')
