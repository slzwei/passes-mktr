import React from 'react';

export default function MilestonePass({ passData }) {
    const { 
        color = 'rgb(139, 69, 19)',
        logoIcon = 'LOGO',
        logoTitle = '',
        logoImage = null,
        stamps = 4,
        totalStamps = 10,
        cardHolder = 'John Doe',
        nextReward = 'Free coffee at 5 stamps',
        backgroundImage = '/storage/images/processed/default-strip-background.png',
        stampIcon = null
    } = passData || {};

    return (
        <div 
            className="relative rounded-2xl shadow-2xl overflow-hidden flex flex-col" 
            style={{ width: '375px', height: '504px', backgroundColor: color }}
        >
            {/* Header Section */}
            <div 
                className="flex items-center justify-between" 
                style={{ height: '80px', padding: '20px', backgroundColor: color }}
            >
                <div className="flex items-center">
                    <div 
                        className="flex-shrink-0" 
                        style={{ width: '50px', height: '50px', backgroundColor: 'transparent' }}
                    >
                        <div 
                            className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden" 
                            style={{ width: '50px', height: '50px' }}
                        >
                            {logoImage ? (
                                <img 
                                    src={logoImage} 
                                    alt={logoTitle || 'Logo'} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-gray-600 text-sm font-medium">{logoIcon}</span>
                            )}
                        </div>
                    </div>
                    <div className="text-left px-3" style={{ maxWidth: '160px' }}>
                        <h1 
                            className="font-bold leading-tight" 
                            style={{ color: 'rgb(255, 255, 255)', fontSize: '12px' }}
                        >
                            {logoTitle}
                        </h1>
                    </div>
                </div>
                <div className="flex-shrink-0 text-right" style={{ color: 'rgb(255, 255, 255)' }}>
                    <div>
                        <div className="text-xs opacity-75 mb-1" style={{ color: 'rgb(255, 255, 255)' }}>
                            NEXT REWARD
                        </div>
                        <div className="font-medium text-right" style={{ fontSize: '12px' }}>
                            {totalStamps - stamps} stamp{totalStamps - stamps !== 1 ? 's' : ''} more
                        </div>
                    </div>
                </div>
            </div>

            {/* Stamp Strip Section */}
            <div 
                className="relative stamp-strip-container" 
                style={{ width: '375px', height: '144px', backgroundColor: 'rgb(245, 245, 245)' }}
            >
                <div 
                    className="absolute inset-0 w-full h-full" 
                    style={{ 
                        backgroundImage: `url("${backgroundImage}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                        backgroundRepeat: 'no-repeat',
                        opacity: 0.8 
                    }}
                ></div>
                <div 
                    className="relative z-10 h-full flex items-center justify-center" 
                    style={{ 
                        paddingTop: '18px',
                        paddingBottom: '18px',
                        marginLeft: '12px',
                        marginRight: '12px' 
                    }}
                >
                    <div 
                        className="grid" 
                        style={{ 
                            gridTemplateColumns: 'repeat(5, 48px)',
                            gridTemplateRows: 'repeat(2, 48px)',
                            gap: '12px',
                            width: '288px',
                            height: '108px' 
                        }}
                    >
                        {[...Array(totalStamps)].map((_, i) => {
                            const isEarned = i < stamps;
                            const isNext = i === stamps;
                            const isLastRow = i >= 5;
                            const isSpecialReward = i === 4 || i === 9; // 5th and 10th stamps
                            
                            return (
                                <div 
                                    key={i}
                                    className="rounded-full border-2 flex items-center justify-center overflow-hidden relative" 
                                    style={{ 
                                        width: '48px',
                                        height: '48px',
                                        borderColor: isEarned ? color : `rgba(139, 69, 19, 0.25)`,
                                        backgroundColor: isEarned ? color : 'rgb(229, 231, 235)',
                                        boxShadow: isEarned ? 'rgba(0, 0, 0, 0.1) 0px 2px 4px' : 'none',
                                        borderStyle: 'solid',
                                        borderWidth: (isNext || isSpecialReward) && !isEarned ? '3px' : '2px'
                                    }}
                                >
                                    {isEarned && stampIcon && (
                                        <img 
                                            src={stampIcon} 
                                            alt="Stamp" 
                                            className="w-6 h-6 object-cover"
                                        />
                                    )}
                                    {((isNext || isSpecialReward) && !isEarned) && (
                                        <div 
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold" 
                                            style={{ fontSize: '8px' }}
                                        >
                                            ★
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Secondary Fields Section */}
            <div className="px-4 py-3" style={{ backgroundColor: color }}>
                <div className="flex justify-between items-center h-full">
                    <div className="flex-1">
                        <div className="text-xs opacity-75 mb-1" style={{ color: 'rgb(255, 255, 255)' }}>
                            CARD HOLDER
                        </div>
                        <div className="text-sm font-medium" style={{ color: 'rgb(255, 255, 255)' }}>
                            {cardHolder}
                        </div>
                    </div>
                    <div className="flex-1 text-right">
                        <div className="text-xs opacity-75 mb-1" style={{ color: 'rgb(255, 255, 255)' }}>
                            NEXT REWARD
                        </div>
                        <div className="text-sm font-medium" style={{ color: 'rgb(255, 255, 255)' }}>
                            {nextReward}
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" style={{ backgroundColor: color }}></div>

            {/* Barcode Section */}
            <div 
                className="flex items-center justify-center mt-auto" 
                style={{ height: '100px', padding: '16px', backgroundColor: color }}
            >
                <div className="flex flex-col items-center bg-white border-2 border-white rounded-md p-2">
                    <div 
                        className="bg-white rounded-lg flex items-center justify-center shadow-sm" 
                        style={{ width: '80px', height: '60px' }}
                    >
                        <div 
                            className="bg-black rounded grid grid-cols-8 gap-0.5" 
                            style={{ width: '64px', height: '48px' }}
                        >
                            {[...Array(64)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className={i % 2 === 0 ? "bg-white" : "bg-black"}
                                ></div>
                            ))}
                        </div>
                        <span className="sr-only">Loyalty Card QR Code</span>
                    </div>
                    <div className="mt-1 text-[10px] text-gray-800 bg-white rounded px-1 py-0.5">
                        Loyalty Card QR Code
                    </div>
                </div>
            </div>
        </div>
    );
}
