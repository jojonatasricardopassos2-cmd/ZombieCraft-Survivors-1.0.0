import fs from 'fs';

let content = fs.readFileSync('components/MainMenu.tsx', 'utf8');

const regex = /{currentUser.skin.mustacheColor \|\| '#111111'}[\s\S]*?{currentUser.skin.mustacheColor: e.target.value}}\)} className="w-full" \/>\s*<\/>\s*\)}\s*<\/div>\s*{\/\* PREVIEW \*\/}\s*<div className="w-full md:w-1\/2 flex items-center justify-center relative bg-gray-800 border-2 border-gray-600 rounded p-4 h-\[350px\]">\s*<div className="text-white text-center flex flex-col items-center">\s*<span className="text-6xl mb-4">👀<\/span>\s*<h2 className="font-bold text-xl mb-2">Preview in-game<\/h2>\s*<p className="text-gray-400 text-sm px-4">As alterações que você fizer aqui serão refletidas detalhadamente em jogo com físicas e animações\.<\/p>\s*<\/div>\s*<\/div>/;

const newPreview = `{currentUser.skin.mustacheColor || '#111111'} onChange={e => setCurrentUser({...currentUser, skin: {...currentUser.skin!, mustacheColor: e.target.value}})} className="w-full" />
                           </>
                       )}
                  </div>
                  
                  {/* PREVIEW */}
                  <div className="w-full md:w-1/2 flex items-center justify-center relative bg-gray-800 border-2 border-gray-600 rounded p-4 h-[350px] overflow-hidden">
                      <div className="flex flex-col items-center justify-center" style={{transform: "scale(5)"}}>
                          {/* HEAD */}
                          <div style={{width: 14, height: 14, backgroundColor: currentUser.skin.skinColor || '#ffcc80', position: 'relative'}}>
                                {/* EYES */}
                                <div style={{position: 'absolute', top: 4, left: 2, width: 3, height: 3, backgroundColor: 'white'}}><div style={{width: 2, height: 2, backgroundColor: currentUser.skin.eyeColor || '#000', margin: '0.5px'}}/></div>
                                <div style={{position: 'absolute', top: 4, right: 2, width: 3, height: 3, backgroundColor: 'white'}}><div style={{width: 2, height: 2, backgroundColor: currentUser.skin.eyeColor || '#000', margin: '0.5px'}}/></div>
                                
                                {/* MOUTH */}
                                {currentUser.skin.mouthType !== 'none' && (
                                    <div style={{position: 'absolute', top: 9, left: 5, width: 4, height: currentUser.skin.mouthType === 'happy' ? 3 : 1, backgroundColor: '#d32f2f', borderRadius: currentUser.skin.mouthType === 'happy' ? '0 0 4px 4px' : '0'}}/>
                                )}
                                
                                {/* MUSTACHE */}
                                {currentUser.skin.hasMustache && (
                                    <div style={{position: 'absolute', top: 8, left: 3, width: 8, height: 1.5, backgroundColor: currentUser.skin.mustacheColor || '#111'}}/>
                                )}

                                {/* HAIR */}
                                {currentUser.skin.hairVariant !== '2' && (
                                    <div style={{position: 'absolute', top: -1.5, left: -1, width: 16, height: 4, backgroundColor: currentUser.skin.hairColor || '#5c4033'}}/>
                                )}
                          </div>
                          
                          {/* BODY CON MAOS JUNTAS */}
                          <div style={{display: 'flex', flexDirection: 'row'}}>
                              {/* ARM LEFT */}
                              <div style={{width: 4, height: 16, backgroundColor: \`hsl(\${parseInt(currentUser.skin.clothes || '6') * 36}, 80%, 50%)\`, borderRight: '1px solid rgba(0,0,0,0.2)'}}>
                                  <div style={{width: 4, height: 4, backgroundColor: currentUser.skin.skinColor || '#ffcc80', marginTop: 12}}/>
                              </div>
                              {/* TORSO */}
                              <div style={{width: 12, height: 18, backgroundColor: \`hsl(\${parseInt(currentUser.skin.clothes || '6') * 36}, 80%, 50%)\`}}/>
                              {/* ARM RIGHT */}
                              <div style={{width: 4, height: 16, backgroundColor: \`hsl(\${parseInt(currentUser.skin.clothes || '6') * 36}, 80%, 50%)\`, borderLeft: '1px solid rgba(0,0,0,0.2)'}}>
                                  <div style={{width: 4, height: 4, backgroundColor: currentUser.skin.skinColor || '#ffcc80', marginTop: 12}}/>
                              </div>
                          </div>
                          
                          {/* PANTS */}
                          <div style={{display: 'flex', flexDirection: 'row', marginTop: -2}}>
                                <div style={{width: 6, height: 10, backgroundColor: \`hsl(\${parseInt(currentUser.skin.pants || '8') * 36}, 60%, 40%)\`, borderRight: '1px solid rgba(0,0,0,0.3)'}}/>
                                <div style={{width: 6, height: 10, backgroundColor: \`hsl(\${parseInt(currentUser.skin.pants || '8') * 36}, 60%, 40%)\`}}/>
                          </div>

                          {/* SHOES */}
                          <div style={{display: 'flex', flexDirection: 'row'}}>
                                <div style={{width: 6, height: 4, backgroundColor: \`hsl(\${parseInt(currentUser.skin.shoes || '1') * 36}, 70%, 20%)\`, borderRight: '1px solid rgba(0,0,0,0.3)'}}/>
                                <div style={{width: 6, height: 4, backgroundColor: \`hsl(\${parseInt(currentUser.skin.shoes || '1') * 36}, 70%, 20%)\`}}/>
                          </div>
                      </div>
                  </div>`;

content = content.replace(regex, newPreview);

fs.writeFileSync('components/MainMenu.tsx', content);
