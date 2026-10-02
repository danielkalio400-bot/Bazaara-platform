"use client";
import {useEffect,useState} from "react";
const languages=["English","Nigerian Pidgin","Hausa","Yorùbá","Igbo","Efik / Ibibio"];
export function FoodLanguageClient(){const[current,setCurrent]=useState("English");useEffect(()=>{setCurrent(localStorage.getItem("bazaara.food.language")||"English")},[]);function choose(value:string){localStorage.setItem("bazaara.food.language",value);setCurrent(value)}return <div className="food-language-list">{languages.map(language=><button key={language} onClick={()=>choose(language)} className={current===language?"active":undefined}><span>{language}</span><small>{current===language?"Preferred":"Available"}</small><b>{current===language?"✓":""}</b></button>)}</div>}
