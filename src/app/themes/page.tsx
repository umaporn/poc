import React from 'react';

export default function ThemesPage() {
  const fontFamilies = [
    { name: 'Sarabun Regular', class: 'font-sarabun-reg', description: 'Sarabun Regular' },
    { name: 'Sarabun Bold', class: 'font-sarabun-bold', description: 'Sarabun Bold' },
    { name: 'Sans Serif', class: 'font-sans', description: 'Clean, modern sans-serif' },
  ];

  const textSizes = [
    { name: 'Extra Small', class: 'text-xs', size: '12px' },
    { name: 'Small', class: 'text-sm', size: '14px' },
    { name: 'Base', class: 'text-base', size: '16px' },
    { name: 'Large', class: 'text-lg', size: '18px' },
    { name: 'Extra Large', class: 'text-xl', size: '20px' },
    { name: '2XL', class: 'text-2xl', size: '24px' },
    { name: '3XL', class: 'text-3xl', size: '30px' },
    { name: '4XL', class: 'text-4xl', size: '36px' },
    { name: '5XL', class: 'text-5xl', size: '48px' },
    { name: '6XL', class: 'text-6xl', size: '60px' }
  ];

  const colorVariants = [
    { name: 'Slate', colors: ['slate-50', 'slate-100', 'slate-200', 'slate-400', 'slate-600', 'slate-800', 'slate-900'] },
    { name: 'Red', colors: ['red-50', 'red-100', 'red-200', 'red-400', 'red-600', 'red-800', 'red-900'] },
    { name: 'Orange', colors: ['orange-50', 'orange-100', 'orange-200', 'orange-400', 'orange-600', 'orange-800', 'orange-900'] },
    { name: 'Yellow', colors: ['yellow-50', 'yellow-100', 'yellow-200', 'yellow-400', 'yellow-600', 'yellow-800', 'yellow-900'] },
    { name: 'Green', colors: ['green-50', 'green-100', 'green-200', 'green-400', 'green-600', 'green-800', 'green-900'] },
    { name: 'indigo', colors: ['indigo-50', 'indigo-100', 'indigo-200', 'indigo-400', 'indigo-600', 'indigo-800', 'indigo-900'] },
    { name: 'Purple', colors: ['purple-50', 'purple-100', 'purple-200', 'purple-400', 'purple-600', 'purple-800', 'purple-900'] }
  ];

  const fontWeights = [
    { name: 'Thin', class: 'font-thin', weight: '100' },
    { name: 'Light', class: 'font-light', weight: '300' },
    { name: 'Normal', class: 'font-normal', weight: '400' },
    { name: 'Medium', class: 'font-medium', weight: '500' },
    { name: 'Semibold', class: 'font-semibold', weight: '600' },
    { name: 'Bold', class: 'font-bold', weight: '700' },
    { name: 'Black', class: 'font-black', weight: '900' }
  ];

  return (
    <div className="min-h-screen p-8 text-center">
      <div className="max-w-7xl mx-auto">
        {/* Header */} 
				<div className="text-6xl font-bold mb-12">
					Theme
				</div> 

        {/* Font Families Section */}
        <section className="mb-16 border-b-2 border-gray-200 pb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">Font Families</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {fontFamilies.map((font) => (
              <div key={font.name} className="border bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <h3 className={`text-2xl font-semibold mb-4 ${font.class}`}>{font.name}</h3>
                <p className={`text-gray-600 mb-4 ${font.class}`}>{font.description}</p>
                <div className={`${font.class} space-y-2`}>
                  <p className="text-sm">The quick brown fox jumps over the lazy dog</p>
                  <p className="text-base">The quick brown fox jumps over the lazy dog</p>
                  <p className="text-lg">The quick brown fox jumps over the lazy dog</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Font Weights Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">Font Weights</h2>
          <div className="flex rounded-xl p-8 shadow-lg border">
            <div className="flex space-x-10 mx-auto">
              {fontWeights.map((weight) => (
                <div key={weight.name} className="text-center">
                  <div className={`text-3xl mb-2 ${weight.class}`}>Aa</div>
                  <div className="text-sm text-gray-600">{weight.name}</div>
                  <div className="text-xs text-gray-400">({weight.weight})</div>
                  <p className={`text-sm mt-2 ${weight.class}`}>Sample text</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Text Sizes Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">Text Sizes</h2>
          <div className="flex rounded-xl p-8 shadow-lg border">
            <div className="space-y-6">
              {textSizes.map((size) => (
                <div key={size.name} className="flex items-center gap-6 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-24 text-sm text-gray-600 font-medium">
                    {size.name}
                  </div>
                  <div className="w-16 text-xs text-gray-400">
                    {size.size}
                  </div>
                  <div className={`${size.class} flex-1`}>
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Color Palette Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">Color Palette</h2>
          <div className="space-y-8">
            {colorVariants.map((colorGroup) => (
              <div key={colorGroup.name} className="rounded-xl p-6 shadow-lg border">
                <h3 className="text-2xl font-semibold mb-6 text-gray-800">{colorGroup.name}</h3>
                <div className="grid grid-cols-7 gap-4">
                  {colorGroup.colors.map((color) => (
                    <div key={color} className="text-center">
                      <div className={`w-full h-16 rounded-lg bg-${color} shadow-sm mb-2`}></div>
                      <div className="text-xs text-gray-600 font-mono">{color}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Text Color Examples */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">Text Colors</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {colorVariants.map((colorGroup) => (
                <div key={`text-${colorGroup.name}`} className="space-y-3">
                  <h4 className="font-semibold text-gray-800">{colorGroup.name} Text</h4>
                  {colorGroup.colors.slice(3, 6).map((color) => (
                    <p key={`text-${color}`} className={`text-${color} text-lg`}>
                      Sample text in {color}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
 
      </div>
    </div>
  );
}