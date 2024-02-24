/**
 * Test Compliance with the JMESPath specification
 *
 * @group unit/jmespath/compliance/identifiers
 */
import { search } from '../../../src';

describe('Identifiers tests', () => {
  it.each([
    {
      data: {
        __L: true,
      },
      expression: '__L',
      expected: true,
    },
    {
      data: {
        '!\r': true,
      },
      expression: '"!\\r"',
      expected: true,
    },
    {
      data: {
        Y_1623: true,
      },
      expression: 'Y_1623',
      expected: true,
    },
    {
      data: {
        x: true,
      },
      expression: 'x',
      expected: true,
    },
    {
      data: {
        '\tF\uCebb': true,
      },
      expression: '"\\tF\\uCebb"',
      expected: true,
    },
    {
      data: {
        ' \t': true,
      },
      expression: '" \\t"',
      expected: true,
    },
    {
      data: {
        ' ': true,
      },
      expression: '" "',
      expected: true,
    },
    {
      data: {
        v2: true,
      },
      expression: 'v2',
      expected: true,
    },
    {
      data: {
        '\t': true,
      },
      expression: '"\\t"',
      expected: true,
    },
    {
      data: {
        _X: true,
      },
      expression: '_X',
      expected: true,
    },
    {
      data: {
        '\t4\ud9da\udd15': true,
      },
      expression: '"\\t4\\ud9da\\udd15"',
      expected: true,
    },
    {
      data: {
        v24_W: true,
      },
      expression: 'v24_W',
      expected: true,
    },
    {
      data: {
        H: true,
      },
      expression: '"H"',
      expected: true,
    },
    {
      data: {
        '\f': true,
      },
      expression: '"\\f"',
      expected: true,
    },
    {
      data: {
        E4: true,
      },
      expression: '"E4"',
      expected: true,
    },
    {
      data: {
        '!': true,
      },
      expression: '"!"',
      expected: true,
    },
    {
      data: {
        tM: true,
      },
      expression: 'tM',
      expected: true,
    },
    {
      data: {
        ' [': true,
      },
      expression: '" ["',
      expected: true,
    },
    {
      data: {
        'R!': true,
      },
      expression: '"R!"',
      expected: true,
    },
    {
      data: {
        _6W: true,
      },
      expression: '_6W',
      expected: true,
    },
    {
      data: {
        '\uaBA1\r': true,
      },
      expression: '"\\uaBA1\\r"',
      expected: true,
    },
    {
      data: {
        tL7: true,
      },
      expression: 'tL7',
      expected: true,
    },
    {
      data: {
        '<<U\t': true,
      },
      expression: '"<<U\\t"',
      expected: true,
    },
    {
      data: {
        '\ubBcE\ufAfB': true,
      },
      expression: '"\\ubBcE\\ufAfB"',
      expected: true,
    },
    {
      data: {
        sNA_: true,
      },
      expression: 'sNA_',
      expected: true,
    },
    {
      data: {
        '9': true,
      },
      expression: '"9"',
      expected: true,
    },
    {
      data: {
        '\\\b\ud8cb\udc83': true,
      },
      expression: '"\\\\\\b\\ud8cb\\udc83"',
      expected: true,
    },
    {
      data: {
        r: true,
      },
      expression: '"r"',
      expected: true,
    },
    {
      data: {
        Q: true,
      },
      expression: 'Q',
      expected: true,
    },
    {
      data: {
        _Q__7GL8: true,
      },
      expression: '_Q__7GL8',
      expected: true,
    },
    {
      data: {
        '\\': true,
      },
      expression: '"\\\\"',
      expected: true,
    },
    {
      data: {
        RR9_: true,
      },
      expression: 'RR9_',
      expected: true,
    },
    {
      data: {
        '\r\f:': true,
      },
      expression: '"\\r\\f:"',
      expected: true,
    },
    {
      data: {
        r7: true,
      },
      expression: 'r7',
      expected: true,
    },
    {
      data: {
        '-': true,
      },
      expression: '"-"',
      expected: true,
    },
    {
      data: {
        p9: true,
      },
      expression: 'p9',
      expected: true,
    },
    {
      data: {
        __: true,
      },
      expression: '__',
      expected: true,
    },
    {
      data: {
        '\b\t': true,
      },
      expression: '"\\b\\t"',
      expected: true,
    },
    {
      data: {
        O_: true,
      },
      expression: 'O_',
      expected: true,
    },
    {
      data: {
        _r_8: true,
      },
      expression: '_r_8',
      expected: true,
    },
    {
      data: {
        _j: true,
      },
      expression: '_j',
      expected: true,
    },
    {
      data: {
        ':': true,
      },
      expression: '":"',
      expected: true,
    },
    {
      data: {
        '\rB': true,
      },
      expression: '"\\rB"',
      expected: true,
    },
    {
      data: {
        Obf: true,
      },
      expression: 'Obf',
      expected: true,
    },
    {
      data: {
        '\n': true,
      },
      expression: '"\\n"',
      expected: true,
    },
    {
      data: {
        '\f\udb54\udf33': true,
      },
      expression: '"\\f\udb54\udf33"',
      expected: true,
    },
    {
      data: {
        '\\\u4FDc': true,
      },
      expression: '"\\\\\\u4FDc"',
      expected: true,
    },
    {
      data: {
        '\r': true,
      },
      expression: '"\\r"',
      expected: true,
    },
    {
      data: {
        m_: true,
      },
      expression: 'm_',
      expected: true,
    },
    {
      data: {
        '\r\fB ': true,
      },
      expression: '"\\r\\fB "',
      expected: true,
    },
    {
      data: {
        '+""': true,
      },
      expression: '"+\\"\\""',
      expected: true,
    },
    {
      data: {
        Mg: true,
      },
      expression: 'Mg',
      expected: true,
    },
    {
      data: {
        '"!/': true,
      },
      expression: '"\\"!\\/"',
      expected: true,
    },
    {
      data: {
        '7"': true,
      },
      expression: '"7\\""',
      expected: true,
    },
    {
      data: {
        '\\\udb3a\udca4S': true,
      },
      expression: '"\\\\\udb3a\udca4S"',
      expected: true,
    },
    {
      data: {
        '"': true,
      },
      expression: '"\\""',
      expected: true,
    },
    {
      data: {
        Kl: true,
      },
      expression: 'Kl',
      expected: true,
    },
    {
      data: {
        '\b\b': true,
      },
      expression: '"\\b\\b"',
      expected: true,
    },
    {
      data: {
        '>': true,
      },
      expression: '">"',
      expected: true,
    },
    {
      data: {
        hvu: true,
      },
      expression: 'hvu',
      expected: true,
    },
    {
      data: {
        '; !': true,
      },
      expression: '"; !"',
      expected: true,
    },
    {
      data: {
        hU: true,
      },
      expression: 'hU',
      expected: true,
    },
    {
      data: {
        '!I\n/': true,
      },
      expression: '"!I\\n\\/"',
      expected: true,
    },
    {
      data: {
        '\uEEbF': true,
      },
      expression: '"\\uEEbF"',
      expected: true,
    },
    {
      data: {
        'U)\t': true,
      },
      expression: '"U)\\t"',
      expected: true,
    },
    {
      data: {
        fa0_9: true,
      },
      expression: 'fa0_9',
      expected: true,
    },
    {
      data: {
        '/': true,
      },
      expression: '"/"',
      expected: true,
    },
    {
      data: {
        Gy: true,
      },
      expression: 'Gy',
      expected: true,
    },
    {
      data: {
        '\b': true,
      },
      expression: '"\\b"',
      expected: true,
    },
    {
      data: {
        '<': true,
      },
      expression: '"<"',
      expected: true,
    },
    {
      data: {
        '\t': true,
      },
      expression: '"\\t"',
      expected: true,
    },
    {
      data: {
        '\t&\\\r': true,
      },
      expression: '"\\t&\\\\\\r"',
      expected: true,
    },
    {
      data: {
        '#': true,
      },
      expression: '"#"',
      expected: true,
    },
    {
      data: {
        B__: true,
      },
      expression: 'B__',
      expected: true,
    },
    {
      data: {
        '\nS \n': true,
      },
      expression: '"\\nS \\n"',
      expected: true,
    },
    {
      data: {
        Bp: true,
      },
      expression: 'Bp',
      expected: true,
    },
    {
      data: {
        ',\t;': true,
      },
      expression: '",\\t;"',
      expected: true,
    },
    {
      data: {
        B_q: true,
      },
      expression: 'B_q',
      expected: true,
    },
    {
      data: {
        '/+\t\n\b!Z': true,
      },
      expression: '"\\/+\\t\\n\\b!Z"',
      expected: true,
    },
    {
      data: {
        '\udadd\udfc7\\ueFAc': true,
      },
      expression: '"\udadd\udfc7\\\\ueFAc"',
      expected: true,
    },
    {
      data: {
        ':\f': true,
      },
      expression: '":\\f"',
      expected: true,
    },
    {
      data: {
        '/': true,
      },
      expression: '"\\/"',
      expected: true,
    },
    {
      data: {
        _BW_6Hg_Gl: true,
      },
      expression: '_BW_6Hg_Gl',
      expected: true,
    },
    {
      data: {
        '\udbcf\udc02': true,
      },
      expression: '"\udbcf\udc02"',
      expected: true,
    },
    {
      data: {
        zs1DC: true,
      },
      expression: 'zs1DC',
      expected: true,
    },
    {
      data: {
        __434: true,
      },
      expression: '__434',
      expected: true,
    },
    {
      data: {
        '\udb94\udd41': true,
      },
      expression: '"\udb94\udd41"',
      expected: true,
    },
    {
      data: {
        Z_5: true,
      },
      expression: 'Z_5',
      expected: true,
    },
    {
      data: {
        z_M_: true,
      },
      expression: 'z_M_',
      expected: true,
    },
    {
      data: {
        YU_2: true,
      },
      expression: 'YU_2',
      expected: true,
    },
    {
      data: {
        _0: true,
      },
      expression: '_0',
      expected: true,
    },
    {
      data: {
        '\b+': true,
      },
      expression: '"\\b+"',
      expected: true,
    },
    {
      data: {
        '"': true,
      },
      expression: '"\\""',
      expected: true,
    },
    {
      data: {
        D7: true,
      },
      expression: 'D7',
      expected: true,
    },
    {
      data: {
        _62L: true,
      },
      expression: '_62L',
      expected: true,
    },
    {
      data: {
        '\tK\t': true,
      },
      expression: '"\\tK\\t"',
      expected: true,
    },
    {
      data: {
        '\n\\\f': true,
      },
      expression: '"\\n\\\\\\f"',
      expected: true,
    },
    {
      data: {
        I_: true,
      },
      expression: 'I_',
      expected: true,
    },
    {
      data: {
        W_a0_: true,
      },
      expression: 'W_a0_',
      expected: true,
    },
    {
      data: {
        BQ: true,
      },
      expression: 'BQ',
      expected: true,
    },
    {
      data: {
        '\tX$\uABBb': true,
      },
      expression: '"\\tX$\\uABBb"',
      expected: true,
    },
    {
      data: {
        Z9: true,
      },
      expression: 'Z9',
      expected: true,
    },
    {
      data: {
        '\b%"\uda38\udd0f': true,
      },
      expression: '"\\b%\\"\uda38\udd0f"',
      expected: true,
    },
    {
      data: {
        _F: true,
      },
      expression: '_F',
      expected: true,
    },
    {
      data: {
        '!,': true,
      },
      expression: '"!,"',
      expected: true,
    },
    {
      data: {
        '"!': true,
      },
      expression: '"\\"!"',
      expected: true,
    },
    {
      data: {
        Hh: true,
      },
      expression: 'Hh',
      expected: true,
    },
    {
      data: {
        '&': true,
      },
      expression: '"&"',
      expected: true,
    },
    {
      data: {
        '9\r\\R': true,
      },
      expression: '"9\\r\\\\R"',
      expected: true,
    },
    {
      data: {
        M_k: true,
      },
      expression: 'M_k',
      expected: true,
    },
    {
      data: {
        '!\b\n\udb06\ude52""': true,
      },
      expression: '"!\\b\\n\udb06\ude52\\"\\""',
      expected: true,
    },
    {
      data: {
        '6': true,
      },
      expression: '"6"',
      expected: true,
    },
    {
      data: {
        _7: true,
      },
      expression: '_7',
      expected: true,
    },
    {
      data: {
        '0': true,
      },
      expression: '"0"',
      expected: true,
    },
    {
      data: {
        '\\8\\': true,
      },
      expression: '"\\\\8\\\\"',
      expected: true,
    },
    {
      data: {
        b7eo: true,
      },
      expression: 'b7eo',
      expected: true,
    },
    {
      data: {
        xIUo9: true,
      },
      expression: 'xIUo9',
      expected: true,
    },
    {
      data: {
        '5': true,
      },
      expression: '"5"',
      expected: true,
    },
    {
      data: {
        '?': true,
      },
      expression: '"?"',
      expected: true,
    },
    {
      data: {
        sU: true,
      },
      expression: 'sU',
      expected: true,
    },
    {
      data: {
        'VH2&H\\/': true,
      },
      expression: '"VH2&H\\\\\\/"',
      expected: true,
    },
    {
      data: {
        _C: true,
      },
      expression: '_C',
      expected: true,
    },
    {
      data: {
        _: true,
      },
      expression: '_',
      expected: true,
    },
    {
      data: {
        '<\t': true,
      },
      expression: '"<\\t"',
      expected: true,
    },
    {
      data: {
        '\uD834\uDD1E': true,
      },
      expression: '"\\uD834\\uDD1E"',
      expected: true,
    },
  ])(
    'should handle different identifiers: $expression',
    ({ data, expression, expected }) => {
      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );
});
