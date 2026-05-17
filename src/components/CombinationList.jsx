import React from 'react';

export default function CombinationList() {
  // Structured array for cleaner rendering and easier data manipulation
  const combinations = [
    {
      id: 'combi-1',
      count: 1,
      coordinates: ['В1-В2-В3-В4-В5'],
      suffix: '',
      isGlow: false,
    },
    {
      id: 'combi-3',
      count: 3,
      coordinates: ['А1-А2-А3-А4-А5', 'В1-В2-В3-В4-В5', 'С1-С2-С3-С4-С5'],
      suffix: '  или их сочетание',
      isGlow: false,
    },
    {
      id: 'combi-5',
      count: 5,
      coordinates: [
        'А1-А2-А3-А4-А5',
        'В1-В2-В3-В4-В5',
        'С1-С2-С3-С4-С5',
        'А1-В2-С3-В4-А5',
        'С1-В2-А3-В4-С5',
      ],
      suffix: '  или их сочетание',
      isGlow: false,
    },
    {
      id: 'combi-7',
      count: 7,
      coordinates: [
        'А1-А2-А3-А4-А5',
        'В1-В2-В3-В4-В5',
        'С1-С2-С3-С4-С5',
        'А1-В2-С3-В4-А5',
        'С1-В2-А3-В4-С5',
        'B1-A2-A3-A4-B5',
        'B1-C2-C3-C4-B5',
      ],
      suffix: '  или их сочетание',
      isGlow: false,
    },
    {
      id: 'combi-9',
      count: 9,
      coordinates: [
        'А1-А2-А3-А4-А5',
        'В1-В2-В3-В4-В5',
        'С1-С2-С3-С4-С5',
        'А1-В2-С3-В4-А5',
        'С1-В2-А3-В4-С5',
        'B1-A2-A3-A4-B5',
        'B1-C2-C3-C4-B5',
        'A1-A2-B3-C4-C5',
        'C1-C2-B3-A4-A5',
      ],
      suffix: '  или их сочетание',
      isGlow: true, // Used to conditionally apply the '--glow' modifier class
    },
  ];

  return (
    <div className="main-container__left">
      <div className="combination-group">
        {combinations.map((item) => (
          <div
            key={item.id}
            id={item.id}
            className={`combination-item ${item.isGlow ? '--glow' : ''}`}
          >
            <h4 className="combination-item__title">Комбинация</h4>
            <span className="combination-item__count">{item.count}</span>
            <p className="combination-item__subTitle">включающая группу координат:</p>
            
            <div className="combination-item__wrapper">
              {item.coordinates.map((coord, idx) => {
                // Dynamically append a comma if it's not the last element in the array
                const isLast = idx === item.coordinates.length - 1;
                return (
                  <span key={idx} className="combination-item__text">
                    {coord}{!isLast && ','}
                  </span>
                );
              })}
              {item.suffix && (
                <span className="combination-item__subTitle">{item.suffix}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}