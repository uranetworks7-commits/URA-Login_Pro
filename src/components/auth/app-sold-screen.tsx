'use client';

import { useState } from 'react';
import { BadgeDollarSign, Building, Rocket, Info, HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';

const CreditLine = ({ text, delay }: { text: string; delay: number }) => (
    <div className="credit-line" style={{ animationDelay: `${delay}s` }}>
        {text}
    </div>
);

export function AppSoldScreen() {
    const [showCredits, setShowCredits] = useState(false);

    const credits = [
        { text: "URA Networks", delay: 2 },
        { text: "Yash Singh (Owner)", delay: 6 },
        { text: "VLF Tec (Raj Singh) Partner", delay: 10 },
        { text: "Utkarsh Kr Singh", delay: 14 },
        { text: "Desinger:- Ankit", delay: 18 },
        { text: "PR Team :- Aman Sharma", delay: 22 },
        { text: "TGL:- Unknown", delay: 26 },
        { text: "The End", delay: 32 },
        { text: "URA Network", delay: 36 }
    ];

    return (
        <>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-black text-white overflow-hidden">
            {!showCredits ? (
                <div className="w-full max-w-2xl bg-black/50 border border-yellow-400/50 rounded-2xl shadow-2xl shadow-yellow-400/20 backdrop-blur-md p-8 text-center space-y-6 z-10">
                    <h1 className="text-4xl font-bold text-yellow-400 flex items-center justify-center gap-4">
                        <BadgeDollarSign className="h-10 w-10" />
                        Acquisition Notice
                    </h1>
                    
                    <div className="text-left bg-white/5 p-4 rounded-lg border border-white/10 space-y-3">
                        <p className="flex items-center gap-3 text-base"><HandCoins className="h-5 w-5 text-yellow-400"/> Sale Price: <span className="font-bold text-lg text-white">1006 USD</span> (Approx. 88,830 INR)</p>
                        <p className="flex items-center gap-3 text-base"><Building className="h-5 w-5 text-yellow-400"/> Former Proprietors: <span className="font-bold text-white">URA Prt Ltd, VLF TeC, TGL, PR-Team</span></p>
                        <p className="flex items-center gap-3 text-base"><Rocket className="h-5 w-5 text-yellow-400"/>Current Owner: <span className="font-bold text-white">Alpha Prime Kanpur Pvt. Ltd.</span></p>
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="bg-yellow-400/10 border-yellow-400/50 text-yellow-300 hover:bg-yellow-400/20 hover:text-yellow-200">
                                <Info className="mr-2 h-4 w-4" /> More Info
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black/80 text-white border-primary/30">
                            <DialogHeader>
                                <DialogTitle className="text-primary text-xl">A Message for Our Legends</DialogTitle>
                            </DialogHeader>
                             <div className="text-white/80 text-base space-y-3 py-4">
                               <p>To our valued URA Legends, this application has been acquired by Alpha Prime.</p>
                               <p>We've had an incredible journey with you. We may lease the app for special events like giveaways, so be sure to check back occasionally.</p>
                               <p className="font-bold text-primary">Thank you, and goodbye.</p>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary" onClick={() => setShowCredits(true)}>
                                        Watch Credits
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            ) : (
                <div className="fixed inset-0 flex items-center justify-center bg-black">
                    <div className="relative w-full h-full overflow-hidden [perspective:300px]">
                        <div className="absolute w-full h-full" style={{ transform: 'rotateX(25deg)' }}>
                             {credits.map((credit, index) => (
                                <CreditLine key={index} text={credit.text} delay={credit.delay} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
             {/* Starfield Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div id="stars"></div>
                <div id="stars2"></div>
                <div id="stars3"></div>
            </div>
            <style jsx global>{`
                @keyframes animStar { from { transform: translateY(0px); } to { transform: translateY(-2000px); } }
                #stars, #stars2, #stars3 {
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; display: block;
                }
                #stars {
                    background: transparent url('https://www.script-tutorials.com/demos/360/images/stars.png') repeat top center;
                    z-index: 0; animation: animStar 50s linear infinite;
                }
                #stars2 {
                    background: transparent url('https://www.script-tutorials.com/demos/360/images/stars.png') repeat top center;
                    z-index: 1; animation: animStar 100s linear infinite;
                }
                #stars3 {
                    background: transparent url('https://www.script-tutorials.com/demos/360/images/stars.png') repeat top center;
                    z-index: 2; animation: animStar 150s linear infinite;
                }
                
                @keyframes scroll-up {
                    from {
                        top: 100%;
                        opacity: 1;
                    }
                    to {
                        top: -50%;
                        opacity: 1;
                    }
                }

                .credit-line {
                    position: absolute;
                    width: 100%;
                    text-align: center;
                    color: #e0e0e0;
                    font-size: 2rem;
                    text-shadow: 0 0 5px #ffd700, 0 0 10px #ffd700;
                    opacity: 0;
                    top: 100%;
                    animation: scroll-up 40s linear infinite;
                }
            `}</style>
        </div>
        </>
    );
}
