import flatMap from 'lodash.flatmap'
describe('swap中的语法', () => {
  describe('#flatMap', () => {
    test('bases list', () => {
      const bases = ['A', 'B', 'C', 'D']
      flatMap(bases, function(base) {
        bases.map(function(otherBase) {
          console.log(base + '-' + otherBase)
        })
      })
    })
  })
})
