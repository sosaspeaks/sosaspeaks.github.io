-- ============================================================
-- SEED REMAINING 11 LEGACY ARTICLES
-- Preserves original titles, subtitles, dates, authors, ratings, and HTML
-- ============================================================

-- 1. 2024election072124.html
INSERT INTO public.articles (
  slug,
  title,
  subtitle,
  hero_image_url,
  hero_image_caption,
  categories,
  read_time,
  review_rating,
  authors,
  post_type,
  legacy_url,
  published,
  unlisted,
  published_at,
  body_html
)
VALUES (
  '2024election072124',
  'The State of the 2024 Election',
  '“Look, I wouldn’t have picked Vice President Trump to be vice president [if] I think she’s not qualified to be president."',
  'assets/images/featured/trumpshot.jpg',
  'Vucci/AP',
  ARRAY['Politics']::text[],
  '9 min read',
  NULL,
  '[{"name":"Sosa","avatar_url":"assets/images/authors/sosaicon1.png"}]'::jsonb,
  'standard',
  'articles/2024election072124.html',
  true,
  false,
  '2024-07-21T12:00:00.000Z',
  $ART_1$
<p class="post-text">Frankly, I didn’t expect an assassination attempt on former president Donald Trump. But with how polarizing the political climate has clearly been since ~2020, it isn’t that stupefying; from the chaotic pandemic conflicts over ‘government overreach’ and masks to the storming of the Capitol, Republicans and Democrats appear to be generally much less open to compromise. <b>Could this make Trump triumph in the election with ’84 Reagan numbers?</b></p>
            <p class="post-text">Additionally, there’s been a moderate divide in the Democratic Party ever since the catastrophe that was the debate on June 27th. Biden’s gaffes were far too easy to attack – even if his points could be half-decent, some of his words were entirely and utterly unintelligible. Now, there are talks from inside and outside the party concerning Biden stepping down – and likely Vice President Harris taking his place on the top of the ticket. Oh, and it seems that he tested positive for COVID-19 a couple of days ago. <b>What will be the consensus of the party?</b></p>
            <p class="post-text">Lastly, is it controversial to say J.D. Vance is a poor vice-president pick? I won’t call myself an expert on Vance, his life, and his beliefs, but picking him is unlikely to help (or hurt) Trump nationally. <b>I don’t know what’s going on in the Republican Party anymore.</b></p>
        <h2 class="sub-heading">Assassination Attempt, and The Topic of ‘Political Violence’</h2>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/072124-election/hulk-hogan-kiss.png" alt="" class="post-image-content">
            </div>
                <p class="image-caption">Trump blowing a kiss to Hulk Hogan at the Republican National Convention, night four. He’s a silly guy!</p>
            <p class="post-text">Reactions to ‘political violence’ recently have been mixed. In the Republican Party, calls to ‘hang’ Mike Pence – that especially became louder during and after January 6th – go unaddressed and undenounced. Political violence never seemed to be a concern when it came to sending bomb threats to hospitals that are/were a minuscule amount supportive of transgender individuals (I am referring to Libs of Tiktok, read more <a href="https://en.wikipedia.org/wiki/Libs_of_TikTok#Harassment_and_threats">here</a>). Jokes about the 2022 attack on Paul Pelosi (and the attempted attack on Nancy Pelosi) were somewhat standard practice, along with <b>bizarre claims of homosexual prostitution having a role in the incident</b>; notably, this misinformation was disseminated by individuals such as Elon Musk, Marjorie Taylor Greene (GA-14), and Donald Trump Jr. But harmless jokes about the attack being told by liberals somehow are inciting violence? This is not meant to be an endorsement of making fun of the assassination attempt, nor is it meant to be a supportive of the notable liberals, such as streamer Destiny, making light of the attempt neither. Simply, I wish that calls for (or making light of) violence were treated the same, regardless of the party affiliation of the one saying it. But, it is unlikely my wish will come true in due time.</p>
            <p class="post-text">Is this incident enough to wildly swing the election in favor of the GOP? I don’t necessarily think so. Trump is already not an extremely popular candidate, and his win in 2016 was nothing in comparison to Reagan’s <b>tremendous landslide</b> in ’80. Additionally, the Trump running today is different from the Trump 8 years ago – the idea of a charismatic outsider making it this far was charming, if not exceptionally appealing to many Republican and “centrist” Americans. After a disaster presidency, though, <b>the allure has faded, and the charisma has become stale</b>. Regardless of the result this November, it shouldn’t be contentious to say that this election is plainly bad. Both candidates have campaigns ranging from lackluster to dreadful, and the prospect of having either for a second term is far from moving.</p>
        <h2 class="sub-heading">The End of a Biden-Harris Ticket</h2>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/072124-election/joebiden-age.png" alt="" class="post-image-content">
                </div>
                <p class="image-caption">Jack Gruber/USA Today</p>
            <p class="post-text">Age seemed to begin to be a concern in late 2021, but ever since Biden has made more gaffes in the public eye, many feel repelled by how <i>‘senile’</i> he has seemed. Any hopes of the Democratic Party covering up his questionable cognitive state were entirely blown up with the first (?) presidential debate roughly a month ago, as I mentioned earlier.</p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/072124-election/debate-1.png" alt="" class="post-image-content">
                </div>
                <p class="image-caption">Gerald Herbert/AP</p>
            <p class="post-text">For example, Dana Bash, a CNN moderator, asked both Trump and Biden,</p>
            <p class="quote-text">
                <i class='bx bxs-quote-left'></i>
                <i>As president, would you block abortion medication?”</i>
            </p>
                <h2 class="sub-heading">Excerpt from Trump's Response:</h2>
                <p class="quote-text">
                    <i class='bx bxs-quote-left'></i>
                    …Now the states are working it out. If you look at Ohio, it was a decision that was – that was an end result that was a little bit more liberal than you would have thought. Kansas I would say the same thing. Texas is different. Florida is different. But they’re all making their own decisions right now. And right now, the states control it. That’s the vote of the people.
                </p>
                <p class="quote-text">
                    Like Ronald Reagan, I believe in the exceptions. I am a person that believes. And frankly, I think it’s important to believe in the exceptions. Some people – you have to follow your heart. Some people don’t believe in that. But I believe in the exceptions for rape, incest and the life of the mother. I think it’s very important. Some people don’t. Follow your heart.
                </p>
                <h2 class="sub-heading">Excerpt from Biden's Response:</h2>
                <p class="quote-text">
                    <i class='bx bxs-quote-left'></i>
                    We’re in a state where in six weeks you don’t even know whether you’re pregnant or not, but you cannot see a doctor, have your – and have him decide on what your circumstances are, whether you need help.
                </p>
                <p class="quote-text">
                    The idea that states are able to do this is a little like saying, we’re going to turn civil rights back to the states, let each state have a different rule.
                </p>
                <p class="quote-text">
                    Look, there’s so many young women who have been – including a young woman who just was murdered and he went to the funeral. The idea that she was murdered by – by – by an immigrant coming in and (inaudible) talk about that.
                </p>
                <p class="quote-text">
                    But here’s the deal, there’s a lot of young women who are being raped by their – by their in-laws, by their – by their spouses, brothers and sisters, by – just – it’s just – it’s just ridiculous. And they can do nothing about it. And they try to arrest them when they cross state lines.
                </p>
            <p class="post-text">Is it wrong to believe that Biden’s response was, at best, off-topic and, at worst, gobbledygook? Though I do not necessarily ‘agree’ with Trump’s view on abortion in a post-Dobbs v. Jackson climate, I can understand what he is saying, despite his repetitive rambling (see second paragraph of excerpt). But Biden’s response? <b>The only essence it evokes is confusion. </b></p>
            <p class="post-text">What he is saying about abortion laws in Georgia is true, and with a bit better delivery, it is a nice opener to a Democratic attack on the basis of the Dobbs decision. In the next sentences, though, he calls abortion a civil right (?) and then makes the most non sequitur comment by mentioning the murder of a young woman by an immigrant. What was the point of bringing this up at all?</p>
            <p class="post-text">Then, in what seems like a last-ditch attempt to get back on topic, Biden makes an incredibly weak and discombobulated ‘argument’ (it hurts to call it that) about incest in relation to abortion, especially when women can be prosecuted for traveling over state lines to receive and/or seek one. I feel that this could be a compelling argument with some more tweaks on delivery and more specificity – except for the fact that Donald Trump already mentioned in his response that he believes in exceptions for rape AND incest. </p>
            <p class="post-text">It wasn’t a vague suggestion – Trump said, <i><b>“But I believe in the exceptions for rape, incest, and the life of the mother.”</b></i> There is no way to misinterpret this into meaning something else. Will that statement be reflected in Trump’s future policies? I’m not sure. But that could’ve been an easy attack for Biden – questioning the integrity of his opponent. However, none of that happened; Democrats blundered on attacking Republicans on the issue they have the most leverage on. Later on in the debate, he says,</p>
                <p class="quote-text">
                    <i class='bx bxs-quote-left'></i>
                    “And if I’m elected, I’m going to restore Roe v. Wade.”
                </p>
            <p class="post-text">This would be very, very compelling… <i><b>if he wasn’t already the incumbent.</b></i> </p>
            <p class="post-text"> I have a strong feeling that the Republicans have secured this election, at least on the executive level. </p>
            <p class="post-text">It’s not that the Democrats are unpopular – it’s that <b>Joe Biden</b> is unpopular.</p>
        <h2 class="sub-heading">Harris 2024?</h2>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/072124-election/kamala-laughing.png" alt="" class="post-image-content">
                </div>
                    <p class="image-caption">Erik Verduzco / Las Vegas Review-Journal</p>
                <p class="quote-text">
                    <i class='bx bxs-quote-left';></i>
                    My mother used to—she would give us a hard time sometimes, and she would say to us, ‘I don’t know what’s wrong with you young people. You think you just fell out of a coconut tree?’ [laughs] You exist in the context of all in which you live and what came before you.
                </p>
            <p class="post-text">We are legitimately in a timeline where I believe Kamala can be, at least, a half-decent Democratic candidate for the President of the United States. Would I prefer someone else? Of course – I used to be a fan of Bernie Sanders’ campaigns for the Democratic nomination in 2016 and 2020. But, frankly, he would be a poor candidate to run, especially in an election where age is such a major issue (<i>Sanders is 82 years old</i>). Additionally, I’m not very well versed on Gretchen Whitmer, but she seems like a monstrously better candidate from what I’ve heard. Let us be honest, though – Harris seems to be an ideal, easy choice for the time being. Will she get the Democrats a landslide? <b>Absolutely not</b>. But I do think she has the potential for a close victory in November. Frankly, she is a step ahead of Hillary Clinton, and I am <b>firmly opposed</b> to her “retrying” the 2016 election this year. It is very obvious that it will not go well. I do not think it is absurd to suggest Harris – or even Michelle Obama, as a slight wildcard – as the Democratic nominee. She has much more energy to do public appearances, as she does not require as much sleep as Biden due to her being 22 years younger (and I believe much healthier?) than him. This younger status also can make her a bit more ‘relatable’ with younger voters, arguably. She is also a bit charismatic; I don’t think she can out-charm Trump, but she’ll do a much better job than Biden, and even past candidates like Ron DeSantis. Lastly, she has a good amount of experience that can especially be framed against Trump – her <b>past positions as a District Attorney and an Attorney General</b> contrast positively with Trump’s status as a felon. But, frankly, I don’t have much hope for the Democrats making a smart decision in this situation; it is usually very hard to agree with their approaches to policy, especially with a constant <b>“they go low, we go high”</b> mindset (that basically means “they go low, we do nothing, they go lower”). I don’t really know what to feel.</p>
            <h2 class="sub-heading">RUSH UPDATE – 7/21/24</h2>
                <div class="post-image-wrapper">
                <img src="assets/images/articles/072124-election/kamala-endorsed.jpg" alt="" class="post-image-content">
                <img src="assets/images/articles/072124-election/biden-dropout-tweet.png" alt="" class="post-image-content">
                </div>
                <p class="post-text">I expected this, but I also didn’t expect it. He dropped out an hour from when I am currently writing this and endorsed Kamala Harris 30 minutes later. Is this the doing of Nancy Pelosi?</p>
                <p class="post-text">A part of me feels that the constant joking about this on Twitter has manifested this event into existence; I mean, a “well-known Democratic operative” reportedly said, “<a href="https://www.cnn.com/2024/07/20/politics/democratic-consensus-harris-should-biden-step-aside/index.html"><i>F**k it, I’m coconut pilled.</a></i>”</p>
                <p class="post-text">Regarding Vice President picks, I’m unsure what approach the party will take ballot-wise. For a full female ticket:</p>
            <ul>
                <li><p class="post-text">Hillary Clinton would be an abominable pick. Her presidential bid course has been run dry, and she’s already lost against Trump once – I’d hate to see it again.</p></li>
                <li><p class="post-text">Gretchen Whitmer would actually be pretty good. She’s fairly popular in Michigan as governor, and, as of now, that state is looking horrible for the Democrats. In a series of recent <a href="https://projects.fivethirtyeight.com/polls/michigan/">polls</a> by Clean and Prosperous America, out of her, Biden, and Harris, she is the only one ahead of Trump (unfortunately by a 1-point margin).</p></li>
                <li><p class="post-text">There are a couple of random polls on the sustainability of a Michelle Obama run; the polls range from break-even with Trump to him leading with 3 points to <b><a href="https://www.ipsos.com/en-us/only-michelle-obama-bests-trump-alternative-biden-2024"> Obama leading with 12 points</a>.</b> Maybe I wouldn’t be too opposed to this.</p></li>
            </ul>
            <p class="post-text">This was a rushed addition; I’ll have to keep following this story and update with another write-up in the coming days.</p>
        <h2 class="sub-heading">J.D. Vance, VP</h2>
            <p class="post-text">It feels bad to end this off on such a boring and brief note. I do not think J.D. Vance is much of a riveting candidate for Vice President – at least, not riveting enough to wait so long to announce him. I thought this wait would mean unexpectedly picking a VP to boost votes by a fair margin: a <b>McCain-style</b> Nikki Haley pick to try and swoon over Never-Trump Republicans, or even a spontaneous Marco Rubio pick to secure (?) Florida and some Hispanic voters. But Vance doesn’t really do much for the Republican ticket; trying to get voters from Ohio seems unnecessary since Trump has been leading the state with fairly strong numbers. Overall, this pick doesn’t seem like it’ll draw away or entice any voters – it is a strong no from me.</p>
        <h2 class="sub-heading">A Desperate Attempt at a Coherent Conclusion</h2>
        <p class="post-text">This year has been so incredibly puzzling and historic for the United States. It's hard to not keep my eyes glued to the news, since it feels like every second there'll be a new headline to send me into a daze. I'm glad I've gained the motivation to get back into a writing mentalese as things have started to heat up; apologies for going months without a new write-up.</p>
        <h2 class="sub-heading">Further Reading</h2>
        <p class="source"> “READ: Biden-Trump Debate Transcript | CNN Politics.” CNN, 28 June 2024,<a href="https://www.cnn.com/2024/06/27/politics/read-biden-trump-debate-rush-transcript/index.html.">www.cnn.com/2024/06/27/politics/read-biden-trump-debate-rush-transcript/index.html.</a></p>
        <p class="source">ettingermentum. “Is It Over?” Ettingermentum.news, 15 July 2024, <a href="https://www.ettingermentum.news/p/is-it-over">www.ettingermentum.news/p/is-it-over</a>.Accessed 21 July 2024.</p>
$ART_1$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  hero_image_url = EXCLUDED.hero_image_url,
  hero_image_caption = EXCLUDED.hero_image_caption,
  categories = EXCLUDED.categories,
  read_time = EXCLUDED.read_time,
  review_rating = EXCLUDED.review_rating,
  authors = EXCLUDED.authors,
  legacy_url = EXCLUDED.legacy_url,
  published = EXCLUDED.published,
  unlisted = EXCLUDED.unlisted,
  published_at = EXCLUDED.published_at,
  body_html = EXCLUDED.body_html;

-- 2. americaninterventionism032124.html
INSERT INTO public.articles (
  slug,
  title,
  subtitle,
  hero_image_url,
  hero_image_caption,
  categories,
  read_time,
  review_rating,
  authors,
  post_type,
  legacy_url,
  published,
  unlisted,
  published_at,
  body_html
)
VALUES (
  'americaninterventionism032124',
  'The Consequences of American Interventionism',
  '<a href="https://www.youtube.com/watch?v=38phkRUNWOQ">"America Is Not The World" - Morrissey, You Are The Quarry</a>',
  'assets/images/featured/intervention1.jpg',
  NULL,
  ARRAY['History', 'Politics']::text[],
  '4 min read',
  NULL,
  '[{"name":"Sosa","avatar_url":"assets/images/authors/sosaicon1.png"}]'::jsonb,
  'standard',
  'articles/americaninterventionism032124.html',
  true,
  false,
  '2024-03-21T12:00:00.000Z',
  $ART_2$
<h2 class="sub-heading">The 2010 leaking of classified United States Army documents unveiled a staggering estimate of 66,081 civilian deaths in Iraq from the period January 2004 to December 2009, attributed directly to the Operation Iraqi Freedom. </h2>
        <p class="post-text"> Among these casualties were tragic instances of deliberate killings, including pregnant women and the mentally ill, merely for inadvertently approaching checkpoints too closely. The leaking of these documents highlighted the evolution of warfare in a digital age and showed current generations the true carnage of military intervention.</p>
            <p class="post-text">Regardless of intent, the mass and irresponsible killing of the innocent is morally indefensible. While the global promotion of democracy is desirable, military/humanitarian intervention has had disastrous consequences and should be avoided or approached more carefully in the future because of horrible human rights abuses, vast economic consequences, and violations of political sovereignty, making intervention overall ineffective.</p>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/032124-interventionism/guantanamo.png" alt="" class="post-image-content">
            </div>
        <h2 class="sub-heading">Military and humanitarian intervention, while often justified as a way to protect human rights, tends to paradoxically lead to egregious violations of those rights it seeks to uphold.</h2>
        <p class="post-text">During the early stages of the Iraq War, the Iraqi Abu Ghraib prison was utilized by the United States Army detain suspected terrorists, even if given little evidence; soldiers took this opportunity to humiliate and torture these detainees, even “<b>photograph[ing] [some] in sexually suggestive … poses</b>”.</p>
        <p class="post-text">Similarly, after the Guantanamo Bay detention camp was opened in 2002 following the 9/11 terror attacks, vile abuses occurred there. As described in an official interrogation log, interrogators at Guantanamo abused Mohammed al-Qahtani, the alleged failed 20th hijacker of the 9/11 terror attacks, making him do things such as worship a shrine of Osama bin Laden (the mastermind behind the 9/11 attacks), follow dog orders such as “stay, come, and bark”, and constantly be strip searched, among dozens of other inhumane acts. These were all carried out despite the fact that al-Qahtani was never convicted of any crime. Intervention in the name of human rights seems to be one of today’s greatest falsehoods, as major foreign military interventions have tended to result in worse human rights abuses than previous regimes (in the area).</p>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/032124-interventionism/abugharib.png" alt="" class="post-image-content">
            </div>
        <h2 class="sub-heading">Military intervention also tends to have a large economic toll, costing more than it is worth.</h2>
        <p class="post-text">The Iraq War cost the United States $2 trillion – valuable resources that could have gone to supporting the United States’ civilian population, especially during the severe aftermath of 2005’s Hurricane Katrina. Resources such as a significant portion of the Louisiana and Mississippi National Guards and emergency response equipment could have domestically assisted Americans in the death and destruction resulting from Katrina.</p>
        <p class="post-text">However, the war also put an insane strain on the economy of Iraq in its process of rebuilding its nation. Hundreds of billions of dollars had to be allocated to rebuild essential infrastructure, such as hospitals, schools, and roads. These billions of dollars were heavily borrowed from international financial institutions, which additionally put a strain on the debt of Iraq; in 2004, the national debt of Iraq was <b>344.3%</b> of its gross domestic product. This only further contributed to the destabilization of the nation. With the poor, simply unsuccessful result of the Iraq War, the political consequences seem to be brought down even more by the economic consequences of these operations.</p>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/032124-interventionism/katrina.png" alt="" class="post-image-content">
            </div>
        <h2 class="sub-heading">Supporters of global intervention argue that despite the economic and human toll, changes undertaken during intervention ultimately lead to a global spread of democracy, following the Truman Doctrine against authoritarian regimes.</h2>
        <p class="post-text">However, this doctrine has been historically used to violate political sovereignty, exercising what it intended to limit the growth of the Soviet Union at all costs. Salvador Allende, a member of the Socialist Party of Chile, was democratically elected by the Chilean public through a close plurality (which was then decided by Congress) to become the 28th president of Chile after the 1970 election. However, due to his left-leaning beliefs adjacent to nations like the Soviet Union, United States intelligence had an unfavorable view of this decision, seeing his presidency as further spreading communism worldwide; the Central Intelligence Agency admitted their involvement through 2023 unclassified documents.</p>
        <p class="post-text">This was despite the fact that his presidency saw major wins, such as a decrease in inflation simultaneously with an increase in real wages. As a result, in 1973, the Central Intelligence Agency (CIA) staged a military coup d’etat to oust Allende from his position despite the fair circumstances under which he was elected. During this coup, Allende died from what seemed to be a suicide. The CIA then replaced Allende with Augusto Pinochet – a leader more aligned with their beliefs, but also a leader that would also go on to be one of the cruelest dictators in modern history. His 17-year rule was marked by drastic increases in economic inequality, horrible levels of corruption, and appalling human rights abuses (Reel and Smith). Though the spread of democracy seems like a noble goal, historically, it has been misused by even some of the largest global “democratic” powers.</p>
            <div class="post-image-wrapper">
            <img src="assets/images/articles/032124-interventionism/allende.jpeg" alt="" class="post-image-content">
            </div>
        <h2 class="sub-heading">Military/humanitarian intervention has historically resulted in thousands of unnecessary casualties, immense economic toll, and suppression of democracy globally, ultimately making such intervention an unwise, inefficient endeavor.</h2>
        <p class="post-text">In the first President of the United States’ farewell address, George Washington warned against “permanent alliances with other countries” and other perils of aggressive globalization, in fear that such alliances would conflict with domestic interests. The monitory wisdom of Washington continues to echo in the modern era; it is crucial that governments exercise caution in navigating international relations in the form of showing restraint. One must learn from the mistakes of history in order to forge a more just future for generations to come.</p>
        <h2 class="sub-heading">Further Reading</h2>
            <p class="source">Carlstrom, Gregg. “Civilians in the Crossfire - Secret Iraq Files.” <i>Al Jazeera</i>, 23 Oct. 2010, <a href="https://web.archive.org/web/20101023051207/english.aljazeera.net/secretiraqfiles/2010/10/2010102216241633174.html">web.archive.org/web/20101023051207/english.aljazeera.net/secretiraqfiles/2010/10/2010102216241633174.html.</a>
            <p class="source">Central Intelligence Agency. “CIA Activities in Chile — Central Intelligence Agency.” <i>Central Intelligence Agency</i>, 12 June 2007, <a href="https://web.archive.org/web/20070612225422/www.cia.gov/library/reports/general-reports-1/chile/index.html">web.archive.org/web/20070612225422/www.cia.gov/library/reports/general-reports-1/chile/index.html.</a>
            <p class="source">International Monetary Fund. “Iraq Datasets.” <i>Www.imf.org</i>, <a href="https://www.imf.org/external/datamapper/profile/IRQ">www.imf.org/external/datamapper/profile/IRQ.</a>
            <p class="source">Kornbluh, Peter. “The Coup in Chile: CIA Releases Top Secret 9/11/1973 President’s Daily Brief.” <i>Nsarchive.gwu.edu</i>, 25 Aug. 2023, <a href="https://nsarchive.gwu.edu/briefing-book/chile/2023-08-25/coup-chile-cia-releases-top-secret-9111973-presidents-daily-brief">nsarchive.gwu.edu/briefing-book/chile/2023-08-25/coup-chile-cia-releases-top-secret-9111973-presidents-daily-brief.</a>
            <p class="source">---. <i>The Pinochet File: A Declassified Dossier on Atrocity and Accountability</i>. The New Press, 2003.
            <p class="source">Kramer, Paul A. “The Untold Story of the Iraq War’s Disastrous Toll on the City of New Orleans.” <i>Slate Magazine</i>, 7 Sept. 2016, <a href="https://slate.com/news-and-politics/2016/09/how-the-iraq-war-set-the-stage-for-the-hurricane-katrina-disaster.html">slate.com/news-and-politics/2016/09/how-the-iraq-war-set-the-stage-for-the-hurricane-katrina-disaster.html.</a>
            <p class="source">Li, Jane-Yu Ho, et al. “The Macroeconomics of Populism in Latin America.” <i>Southern Economic Journal</i>, vol. 59, no. 4, Apr. 1993, p. 843, <a href="https://doi.org/10.2307/1059755">https://doi.org/10.2307/1059755.</a>
            <p class="source">Reel, Monte, and J. Y. Smith. “A Chilean Dictator’s Dark Legacy.” <i>Washington Post</i>, 11 Dec. 2006, <a href="https://www.washingtonpost.com/wp-dyn/content/article/2006/12/10/AR2006121000302.html">www.washingtonpost.com/wp-dyn/content/article/2006/12/10/AR2006121000302.html.</a>
            <p class="source">Scurfield, Raymond M. “The Nexus between the Iraq War and Katrina Recovery.” <i>Trauma, Violence, & Abuse</i>, vol. 10, no. 2, Apr. 2009, pp. 181–92, <a href="https://doi.org/10.1177/1524838008328059">https://doi.org/10.1177/1524838008328059.</a>
            <p class="source">Smeulers, Alette, and Sander van Niekerk. “Abu Ghraib and the War on Terror—a Case against Donald Rumsfeld?” <i>Crime, Law and Social Change</i>, vol. 51, no. 3-4, Nov. 2008, pp. 327–49, <a href="https://doi.org/10.1007/s10611-008-9160-2">https://doi.org/10.1007/s10611-008-9160-2.</a>
            <p class="source">U.S. Department of Defense. “SECRET ORCON - INTERROGATION LOG DETAINEE 063.” <i>Time Magazine</i>, Time, 20 June 2005, <a href="https://content.time.com/time/2006/log/log.pdf">content.time.com/time/2006/log/log.pdf.</a>
            <p class="source">Washington, George. <i>Washington’s Farewell Address</i>. 19 Sept. 1796, <a href="https://www.govinfo.gov/content/pkg/GPO-CDOC-106sdoc21/pdf/GPO-CDOC-106sdoc21.pdf">www.govinfo.gov/content/pkg/GPO-CDOC-106sdoc21/pdf/GPO-CDOC-106sdoc21.pdf.</a>
            <p class="source">WikiLeaks. “Baghdad War Diary.” <i>Wikileaks.org</i>, 2010, <a href="https://wikileaks.org/irq/">wikileaks.org/irq/.</a>
            <p class="source">World Bank. “United Nations/World Bank Joint Iraq Needs Assessment.” <i>World Bank</i>, Oct. 2003, pp. 54–58. Accessed 3 Mar. 2024.
            </p>
$ART_2$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  hero_image_url = EXCLUDED.hero_image_url,
  hero_image_caption = EXCLUDED.hero_image_caption,
  categories = EXCLUDED.categories,
  read_time = EXCLUDED.read_time,
  review_rating = EXCLUDED.review_rating,
  authors = EXCLUDED.authors,
  legacy_url = EXCLUDED.legacy_url,
  published = EXCLUDED.published,
  unlisted = EXCLUDED.unlisted,
  published_at = EXCLUDED.published_at,
  body_html = EXCLUDED.body_html;

-- 3. bibicongressone081424.html
INSERT INTO public.articles (
  slug,
  title,
  subtitle,
  hero_image_url,
  hero_image_caption,
  categories,
  read_time,
  review_rating,
  authors,
  post_type,
  legacy_url,
  published,
  unlisted,
  published_at,
  body_html
)
VALUES (
  'bibicongressone081424',
  'CFC: Netanyahu''s Address to Congress',
  'Contextualizing and Fact-Checking (CFC) Prime Minister of Israel Benjamin Netanyahu''s Address to Congress on July 24, 2024.',
  'assets/images/featured/bibinetanyahu2.jpg',
  'Getty Images',
  ARRAY['Politics', 'History']::text[],
  '20 min read',
  NULL,
  '[{"name":"Sosa","avatar_url":"assets/images/authors/sosaicon1.png"}]'::jsonb,
  'standard',
  'articles/bibicongressone081424.html',
  true,
  false,
  '2024-08-19T12:00:00.000Z',
  $ART_3$
<p class="post-text">Roughly two weeks ago, Benjamin ‘Bibi’ Netanyahu spoke to the United States Congress to comment on the status of the conflict between the state of Israel and Hamas (and secondarily Hezbollah and the state of Iran). This is his second address to a joint session of Congress; on his first address in 2015, 58 Democrats skipped the speech. Now, nine years later, roughly 128 skipped the speech (making about half of each caucus absent) – some in <b>protest</b> (<i>Alexandria Ocasio-Cortez</i>) and others simply due to other conflicting arrangements (<i>Tim Kaine</i>). In this address, Bibi made a slew of claims about the war; <b>some claims simply need (or are preferred with) context, while others are false and require a fact check</b>. As a result, I have decided to provide such in a series of articles titled CFC (Context and Fact Check), which will later include studies and deconstructions of the words of other politicians and public figures; however, Bibi’s speech contains so many claims needing analysis that this CFC must be spliced into two parts. Additionally, since this part is already quite long on its own, I have added a hyperlinked table of contexts for the reader's convenience.
        </p>
            <div class="toc-box">
                <h2 class="sub-heading" id="toctitle">Table of Contents</h2>
                    <p class="toc">
                        <br><a href="#barb">1. Barbarism v. Civilization</a>
                        <br><a href="#pearl">2. Pearl Harbor as a Comparison to Oct. 7th</a><br>
                        <a href="#oct7a">3. Bibi’s Equivocal Account of Oct. 7th</a><br>
                        <a href="#lions">4. Context Helpful: ‘The Lions of Israel’</a><br>
                        <a href="#flag">5. Protest Through Flag Burning</a><br>
                        <a href="#adhom">6. The Ad Hominem, ‘Gays for Gaza’</a><br>
                            <a href="#sidetrack" class="toc-nested-link">6.5. Sidetrack: These Charlatans Make the Front Page?</a><br>
                        <a href="#nonseq">7. Israel as a Colonial State; Non-Sequitur Argumentation</a><br>
                    </p>
            </div>
            <div class="post-image-wrapper">
                <img src="assets/images/featured/bibinetanyahu.jpg" alt="Netanyahu addressing Congress in 2015" class="post-image-content">
            </div>
            <p class="image-caption">Netanyahu addressing Congress in 2015.</p>
        <h2 class="sub-heading" id="barb">1. Barbarism v. Civilization</h2>
                <p class="quote-text">
                    <i class='bx bxs-quote-left'></i>
                    <i>We meet today at a crossroads of history. Our world is in upheaval. In the Middle East, Iran’s axis of terror confronts America, Israel, and our Arab friends. This is not a clash of civilizations. It’s a clash between barbarism and civilization. It’s a clash between those who glorify death and those who sanctify life.</i>
                </p>
                <p class="post-text">The juxtaposition created between “barbarism and civilization” is provocative, to say the least. Such a statement is not surprising if one looks back at the October 9th statement from Israeli Defense Minister Yoav Gallant, <a href="https://www.aljazeera.com/program/newsfeed/2023/10/9/israeli-defence-minister-orders-complete-siege-on-gaza">saying</a> that Israel is “fighting human animals.” Arguably, one cannot objectively assume that either Netanyahu or Gallant is referring to only Hamas (and likely the Houthis and Hezbollah). Sayings of this manner can radiate the impression that the Israeli government is calling the entire population of Palestine “barbaric” or sub-human; this is further driven by the <b>lack of sympathy</b> towards the Palestinian civilian casualties throughout this address to Congress and other statements from Israeli officials. For example, Al Arabiya <i>(a Saudi state-owned news channel)</i> reported on October 11th that Gallant said
                </p>
                <p class="quote-text">
                    <i class='bx bxs-quote-left'></i>
                    Gaza won't return to what it was before. We will eliminate everything.
                </p>
                <p class="post-text">Nevertheless, let us continue with the wishful assumption that Netanyahu is classifying Hamas and co. as barbarism and Israel as civilization.
                </p>
        <h2 class="sub-heading" id="pearl">2. Pearl Harbor as a Comparison to Oct. 7th</h2>
            <p class="quote-text">
                <i class='bx bxs-quote-left'></i>
                <i>Ladies and gentlemen, like December 7th, 1941, and September 11th, 2001, October 7th is a day that will forever live in infamy.</i>
            </p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/081424-netanyahu/pearlharbor1.jpg" alt="The attack on Pearl Harbor. Keystone/Getty Images" class="post-image-content">
                </div>
                <p class="image-caption">The attack on Pearl Harbor. Keystone/Getty Images</p>
            <p class="post-text">For context <i>(since the date of this event is not as commonly remembered as 9/11)</i>, December 7th, 1941, was the day the Imperial Japanese Navy attacked the Hawaii Pearl Harbor naval base. I assume he chose these America-centric tragedies to send a message of empathy. Still, I feel that it is odd not to reference any tragedies that have occurred adjacent to Israel. For example, he could have cited the 5th of September 1972, which was the day the <b>Munich Olympics</b>* massacre began/mainly took place; such would be a wildly more relevant reference considering the Paris Olympics are currently happening (at the time of his speech). Maybe I’m being a bit too critical.
            </p>
            <p class="image-caption">*If not aware, the Munich Olympics massacre refers to the terror attack that took place during the 1972 Summer Olympics in Munich, where members of the Palestinian militant Black September organization initially killed two Israeli athletes and took nine other Israeli athletes and coaches hostage. Those nine hostages were killed early into the next day after a failed rescue attempt by West German police.</p>
        <h2 class="sub-heading" id="oct7a">3. Bibi’s Equivocal Account of Oct. 7th</h2>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/081424-netanyahu/oct71.jpg" alt="" class="post-image-content">
            </div>
        <p class="image-caption">The rubble after Hamas' attack on Kibbutz Be’eri. Edi Israel/Flash90</p>
                <p class="quote-text">
                    <i class='bx bxs-quote-left'></i>
                    <i>It was the Jewish holiday of Simchat Torah. It began as a perfect day. Not a cloud in the sky. Thousands of young Israelis were celebrating at an outdoor music festival. And suddenly, at 6:29 a.m., as children were still sleeping soundly in their beds in the towns and kibbutzim next to Gaza, suddenly heaven turned into hell. Three thousand Hamas terrorists stormed into Israel. They butchered 1,200 people from 41 countries, including 39 Americans. Proportionately, compared to our population size, that’s like 20 9/11s in one day. And these monsters, they raped women, they beheaded men, they burnt babies alive, they killed parents in front of their children and children in front of their parents. They dragged 255 people, both living and dead, into the dark dungeons of Gaza.
                    </i>
                </p>
            <p class="post-text">
            Netanyahu uses fairly good imagery here to describe the early hours of October 7th. It is a shame that the words that follow are, at best, missing context and, at worst, deliberately false.
            </p>
            <p class="post-text">I do understand comparing October 7th to 9/11, as both were terror attacks. <b>It seems that just as the United States was pushed by lies about WMDs to enter Iraq, the Israeli government has spread unverified or exaggerated claims to justify its actions in Gaza</b>. Claims of Hamas beheading babies have been widespread, but there is <a href="https://www.politifact.com/article/2023/nov/21/israel-hamas-war-what-we-know-about-beheaded-babie/">no proof</a> nor an <a href="https://www.lemonde.fr/en/les-decodeurs/article/2024/04/03/40-beheaded-babies-the-itinerary-of-a-rumor-at-the-heart-of-the-information-battle-between-israel-and-hamas_6667274_8.html">airtight alibi</a> that proves such happened. This claim has been echoed dozens of times in American politics, from Ted Cruz's mouth to Joe Biden's. Is it odd to expect the public release of proof for the “beheading babies” claim when it seems the public was immediately given evidence for their claims of Hamas burning babies (Israel’s official social media accounts have posted photos of charred babies many times)? However, there have been many pictures posted online after Israel’s late May strike on a Rafah displacement camp depicting the carnage that occurred toward innocent civilians. <b>Alas, I guess there are no tears for <a href="https://www.newarab.com/news/gaza-father-mourns-baby-son-decapitated-rafah-massacre">beheaded Palestinian babies</b></a> (link is not graphic).</p>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/081424-netanyahu/rafah1.jpg" alt="" class="post-image-content">
            </div>
                <p class="image-caption">The aftermath of the May 27, 2024 strike on a Rafah displacement camp. AP Photo/Jehad Alshrafi</p>
            <p class="post-text">Of course, Israel continued with their strike and Rafah offense despite an <b><a href="https://www.aljazeera.com/news/liveblog/2024/2/7/israels-war-on-gaza-live-israel-pounds-gaza-as-truce-diplomacy-continues?update=2687384">enormous</a> <a href="https://www.aljazeera.com/news/liveblog/2024/2/9/israels-war-on-gaza-live-fear-in-rafah-as-israel-prepares-ground-attack?update=2695470">amount</a> of <a href="https://www.aljazeera.com/news/liveblog/2024/2/13/israels-war-on-gaza-live-jordans-king-urges-ceasefire-in-biden-meeting?update=2705910">United</a> <a href="https://news.un.org/en/story/2024/02/1146672">Nations</a> <a href="https://www.aljazeera.com/news/liveblog/2024/2/15/israels-war-on-gaza-live-four-dead-as-israel-hits-city-in-lebanons-south?update=2709627">officials</a></b> and <b><a href="https://www.aljazeera.com/news/liveblog/2024/2/13/israels-war-on-gaza-live-jordans-king-urges-ceasefire-in-biden-meeting?update=2706065">international</a> <a href="https://www.aljazeera.com/news/liveblog/2024/2/11/israels-war-on-gaza-live-leaders-warn-of-catastrophe-if-rafah-invaded?update=2699757">entities</a> <a href="https://www.reuters.com/world/middle-east/who-warns-assault-gazas-rafah-would-be-an-unfathomable-catastrophe-2024-02-14/">warning</a> <a href="https://www.aljazeera.com/news/liveblog/2024/2/16/israels-war-on-gaza-live-17000-children-torn-from-parents-un-says?update=2711768">against</a> doing so in fear of <a href="https://www.cnn.com/2024/05/24/middleeast/israel-icj-gaza-rafah-south-africa-ruling-intl/index.html">excessive</a> <a href="https://www.aljazeera.com/news/liveblog/2024/2/29/israels-war-on-gaza-live-mass-killing-of-children-in-slow-motion-ngo?update=2740042">civilian</a> <a href="https://www.who.int/news/item/21-02-2024-statement-by-principals-of-the-inter-agency-standing-committee-(iasc)-on-gaza">casualties</a> and breaches of <a href="https://www.ohchr.org/en/press-releases/2024/03/gaza-israels-dehumanisation-displaced-persons-must-end-says-un-expert">international humanitarian law</a></b>. This does make sense, considering the close allyship between Israel and the United States and the United States’ ignorance of international law – but that’s a different topic for a different day, as I fear I am getting tangential.
            </p>
            <p class="post-text">Next, according to the United Nations <a href="https://press.un.org/en/2024/sc15621.doc.htm">investigation</a>, it is incredibly likely that sexual violence occurred on October 7th, and such was unbelievably inhumane and distressing. In this, Netanyahu is telling the truth. I do believe a bit more context would be helpful, in any case. In February, the UN also condemned Israel for “egregious human rights violations” against Palestinian women. These violations include various credible claims of cruel treatment in detention centers, which include <a href="https://apnews.com/article/palestinians-detained-israel-hamas-gaza-war-0ecbc338e4024add059b87b38022086d">threats</a> and <a href="https://www.ohchr.org/en/press-releases/2024/02/israelopt-un-experts-appalled-reported-human-rights-violations-against">occurrences</a> of sexual abuse (including other violations specifically against children, specifically outlined in their June <a href="https://documents.un.org/doc/undoc/gen/n24/095/07/pdf/n2409507.pdf?token=1Ldj5MfovtQtIZmCV1&fe=true">report</a> on children and armed conflict). Now, in August, non-profit organization B'Tselem has created a report titled <a href="https://www.btselem.org/publications/202408_welcome_to_hell">'Welcome to Hell'</a>, which speaks on the "testimonies from 55 Palestinians held [in Israeli custody after October 7th] and released, almost all with no charges." Its findings are troubling, as these collected attestations reveal <b>withholding of medication and medical treatment, prohibiting communal prayer, humiliation by sexual assault, and a plethora of other disgustingly cruel human rights violations that constitute torture</b>. Again, the allyship of the United States and Israel makes a bit more sense <b>when considering this and the United States' <a href="https://sosaspeaks.github.io/americaninterventionism032124.html">flagrant torture</a> towards its detainees at Guantanamo Bay</b> (and, in the past, Abu Ghraib). Nevertheless, I must be clear – <b>this does not excuse, justify, or ‘cancel out’ the sexual assault committed by Hamas</b>. I am, though, disgusted by the ‘holier-than-thou’ demeanor Netanyahu takes when condemning cruel acts by Hamas but failing to address the wrongs of the Israeli government.
            </p>
        <h2 class="sub-heading" id="lions">4. Context Helpful: ‘The Lions of Israel’</h2>
            <p class="quote-text">
                <i class='bx bxs-quote-left'></i>
                <i>Israel has already brought home 135 of these hostages, including seven who were freed in daring rescue operations.
                    As the Bible says, “עם כלביא יקום” —they shall rise like lions. They’ve risen like lions, the lions of Judah, the lions of Israel.
                </i>
            </p>
            <p class="post-text">This quote is from the 23rd chapter of the <a href="https://www.biblegateway.com/verse/en/Numbers%2023%3A24">Book of Numbers</a>, which falls in the Torah. The entire verse is (in the NIV translation):</p>
                <p class="quote-text">
                    <i class='bx bxs-quote-left'></i>
                    <i>The people rise like a lioness; they rouse themselves like a lion that does not rest till it devours its prey and drinks the blood of its victims.</i>
                </p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/081424-netanyahu/balaam1.jpg" alt="" class="post-image-content">
                </div>
                <p class="image-caption">Gustav Jäger's 1836 painting titled Balaam and the Angel.</p>
            <p class="post-text">To add more context, in the Bible, Balaam said this verse to Balak; Balaam was a prophet who spoke the word of the Lord to Balak, a king of Moab (modern-day South Jordan). Balak wished for Balaam to curse the migrating nation of Israel, but he instead did the opposite – blessing Israel and saying the quote above (along with a few other oracles) to the king. In the 25th chapter, though, <b>it seemed that the Israelites “began to indulge in sexual immorality with the daughters of Moab”</b> and worshipped “Baal of Peor,” a Moabite deity. Then, in verse 4, it is written:
            </p>
                <p class="quote-text">
                    <i class='bx bxs-quote-left'></i>
                    <i>Then the LORD said to Moses, “Take all the leaders of the people and execute them in broad daylight before the LORD, so that His fierce anger may turn away from Israel.</i>
                </p>
            <p class="post-text">After this command, a man named Phinehas caught a fellow Israelite engaged with a Midianite woman (the land of Midian was near Moab, and both nations worshipped Baal of Peor) and drove a spear through them both. The Lord then issued a command to kill the Midianites with the reason that the influence of Peor worship and the woman that was killed were forms of ‘seduction’ used against the Israelite population. This vengeance on the Midianites is continued in the 31st chapter, <b>but somewhat randomly, the <a href="https://biblehub.com/numbers/31-8.htm">8th verse</a> says that Balaam was killed</b> in this mission. After this attack, Moses angrily addressed the commanders of their army because they had spared every woman. In response to this, Moses tells them:
            </p>
                <p class="quote-text">
                    <i class='bx bxs-quote-left'></i>
                    <i>Look, these women caused the sons of Israel, <b>through the counsel of Balaam</b>, to turn unfaithfully against the LORD at Peor so that the plague struck the congregation of the LORD. So now, kill all the boys, as well as every woman who has had relations with a man, but spare for yourselves every girl who has never had relations with a man.</i>
                </p>
            <p class="post-text">This now makes Balaam’s morality and faithfulness to God dubious – from the progression of these chapters, it is a bit ambiguous what occurred, but it is ultimately stated in a <a href="https://www.biblegateway.com/passage/?search=Revelation%202%3A14&version=NIV">reference to Balaam</a> in the book of Revelation that since he was unable to curse the Israelites, he instead told Balak how to “entice the Israelites to sin” through idol worship and sexual immorality.
            </p>
            <p class="post-text">Overall, though Balaam’s words that Netanyahu quoted seemed to be spoken in the form of a vessel for the Lord, he could have chosen a better quote from a less morally unreliable figure. I guess this section is also a bit of a treat for my Christian and theology-interested readers.</p>
        <h2 class="sub-heading" id="flag">5. Protest Through Flag Burning</h2>
            <p class="quote-text">
                <i class='bx bxs-quote-left'></i>
                <i>They refuse to make the simple distinction between those who target terrorists and those who target civilians, between the democratic State of Israel and the terrorist thugs of Hamas. We recently learned from the U.S. Director of National Intelligence that Iran is funding and promoting anti-Israel protests in America. They want to disrupt America. So, these protesters burned American flags even on the 4th of July. And I wish to salute the fraternity brothers at the University of North Carolina who protected the American flag, protected the American flag against these anti-Israel protesters.
                </i>
            </p>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/081424-netanyahu/flagburn1.jpg" alt="" class="post-image-content">
            </div>
                <p class="image-caption">Pro-Palestinian demonstrators burning a U.S. flag in front of the U.S. Capitol building on the day of Netanyahu's address. Reuters/Nathan Howard</p>
            <p class="post-text">This is one topic that provokes me to an extreme. The U.S. Director of National Intelligence indeed <a href="https://apnews.com/article/gaza-war-protests-iran-foreign-influence-95e0a161119ed0e060332feda95b4e4f">claimed</a> Iran is funding American protests that oppose Israel; besides that, there isn’t much evidence, <b>so take that as you will</b>. However, Netanyahu’s emphasis on protestors burning American flags – along with Vice President Kamala Harris’ <a href="https://www.usnews.com/news/national-news/articles/2024-07-25/kamala-harris-denounces-flag-burning-protesters-during-netanyahu-visit">statement</a> – is irking. Sure, one can believe that the act of burning the U.S. flag is quite disrespectful to the country, but pretending that it is a crime to burn the flag is incredibly disingenuous. Harris did so to a more substantial degree in her statement, saying that she outright “condemn[s] the burning of the American flag.” <b>Both enjoy conveniently leaving out that flag burning has been <a href="https://supreme.justia.com/cases/federal/us/491/397/">proven</a> by the Supreme Court for more than three decades to be a form of protected speech under the Constitution's First Amendment</b> – in case you forgot, that document is the <b>supreme law of the land</b>. Of course, it would be absurd to want Harris to favor burning the flag – such is nonsensical, as someone with the Vice President role should promote patriotism in some form. But to say that the flag “should never be desecrated in that way” implies that such an act is wrong and likely should be penalized, and that claim in itself is <b>terrible</b> for free speech.
            </p>
        <h2 class="sub-heading" id="adhom">6. The Ad Hominem, ‘Gays for Gaza’</h2>
            <p class="quote-text">
                <i class='bx bxs-quote-left'></i>
                <i>It’s amazing, absolutely amazing. Some of these protesters hold up signs proclaiming “Gays for Gaza.” They might as well hold up signs saying “Chickens for KFC.”
                    These protesters chant, “From the river to the sea.” But many don’t have a clue what river and what sea they’re talking about. They not only get an F in geography, they get an F in history.
                    </i>
            </p>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/081424-netanyahu/gaygaza1.jpg" alt="" class="post-image-content">
            </div>
            <p class="image-caption">Protestors carrying a 'Queers for Palestine' sign. Photo obtained from <a href="https://www.telegraph.co.uk/news/2023/11/09/queers-for-palestine-must-have-a-death-wish/">O'Neill's article; direct source unclear.</a></p>
            <p class="post-text">I am honestly speechless at how these words received <b>three separate rounds of applause</b>. <b>Rather than attempting to look at why these protestors are in support of Gaza despite (likely) disagreeing with the social views and laws supported by Hamas, Bibi instead makes an outlandish comparison to chickens supporting KFC</b> (the fast-food chain where chicken dominates its menu). It pains me to “deconstruct” his attempt at humor, but there is such a noticeable difference between both slogans.
            </p>
            <p class="post-text">In ‘Chickens for KFC,’ the conflict between a chicken’s self-preservation and a company’s need for their meat (for nourishment and ultimately profit) is <b>one-dimensional</b>. There are no legitimate social interests at play – KFC is not remotely close to being a vegan establishment – and there are little to no similarities between the chicken and the corporation.
            </p>
            <p class="post-text">However, in the case of ‘Gays for Gaza,’ <b>the dilemma in Gaza is multifaceted</b>. In the dilemma, there are an array of sub-dilemmas, including but not limited to Hamas versus Israel, the Palestinian people against Israeli occupation, Palestinians against anti-Arab sentiment, etc. In that collection of sub-dilemmas, <b>there is also a dispute between pro-LGBTQ+ activists and the Islamic fundamentalist views of Hamas</b>; additionally, the legality of same-sex relations in the Gaza Strip is dubious due to the long-standing existence of British Mandatory Palestine’s law prohibiting “acting against the law of nature” and its horribly broad application.</p>
            <p class="post-text">However, homosexuality is still an <b>enormous taboo</b>, and there are no laws in Gaza or the West Bank that treat members of the LGBTQ+ community as a protected class from discrimination. Even despite the convoluted history of LGBTQ+ rights in Palestine, Hamas being in opposition to such rights <b>does not negate the existence of gay Palestinians</b>, nor does it negate the fact that some support the freedom of all Palestinians with or without Hamas being their political representative. To equate ‘Gays for Gaza’ to ‘Chickens for KFC,’ <b>one would need to make an objectively false assumption that the all of the ‘Gays’ in question support Hamas either partially or in its entirety</b>. The advocacy of ‘Gays for Gaza,’ for the most part, is supporting the people of Palestine as a whole and usually not specifically including or supporting Hamas in tandem. However, the ‘Gays’ in question that may support Hamas <b>likely do so not in ideological agreeance but rather in support of resistance against a state that they ideologically oppose</b> (Israel) (<i>though they may also disagree with Hamas’ methodology of resistance</i>). Of course, what I am saying also oversimplifies parts of the dilemma, as it is unclear whether Bibi is specifically referencing gay American protestors or gay Palestinian protestors, or even grouping them as one entity; this is important because <b>the situation of gay Palestinians is much more complex, as they can not only feel alienated by fellow Palestinians societally, but also by <a href="https://www.972mag.com/lgbtq-palestinians-haifa-queer/">gay Israelis</a> that do not recognize ‘Palestinian’ as a legitimate identity</b>. This schism is something not unheard of when speaking of queer Palestinians fleeing to Israel to escape persecution for their sexuality or gender identity.
            </p>
            <h3 class="nested-heading" id="sidetrack">6.5: Sidetrack: These Charlatans Make The Front Page?</h3>
                <p class="post-text">Of course, though, some may still believe in a fantasy world where the relations between innocent Palestinians and Israel are sunshine and rainbows, and the only true conflict involves Hamas. This delusion is seen in <a href="https://www.telegraph.co.uk/news/2023/11/09/queers-for-palestine-must-have-a-death-wish/">an article</a> from The Telegraph written by Brendan O’Neill; <b>though I am supposed to be focusing on Netanyahu’s words, I felt a need to tackle the claims made in this article, as I am shocked such an absurd opinion could make it to a big paper</b>.</p>
                <p class="post-text">Throughout this op-ed, O’Neill makes <b>false equivalences between the people of Palestine and members of Hamas</b>. These false equivalences made so often are the reason why some question whether <i>(in my <a href="#barb">1st section</a>)</i> Netanyahu is calling all Palestinians barbaric or only Hamas. Of course, there has to be an attempt at humor in these types of arguments (<b><a href="#adhom">sounds familiar?</a></b>), with the author quoting a post he saw on Instagram:</p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        <i>I saw one comment on Instagram noting that if these [Queers for Palestine protestors] actually went to Palestine, especially Hamas-ruled Gaza, their pronouns would be “was / were”.</i>
                    </p>
                <p class="post-text">Isn’t it so funny to jest about the practically extrajudicial killings of queer people? Ha-ha. So much for pretending to care about the rights of the LGBTQ+ community <b>while actually just using the complicated status of LGBTQ+ Palestinians as a talking point to avoid addressing the legitimate arguments of these protestors</b>.</p>
                <p class="post-text">In general, though, it is quite obvious that this argument is poor. Below, O’Neill turns his focus toward social acceptance of LGBTQ+ people in the state:</p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        <i>Palestine has an atrocious record on LGBT rights. In 2021, the Williams Institute at the University of California, Los Angeles carried out a survey of 175 nations and their acceptance of gay and gender-non-conforming people. Palestine was at number 130. Behind Yemen, Saudi Arabia and the Democratic Republic of Congo.</i>
                    </p>
                <p class="post-text">Within <a href="https://williamsinstitute.law.ucla.edu/wp-content/uploads/Global-Acceptance-Index-LGBTI-Nov-2021.pdf">this same study</a> from the Williams Institute, Ukraine is 142, landing 12 spots below Palestine. <b>So, gay people have no valid reason to support Ukraine against Russian invaders because they’d likely face heavy discrimination if they visited the country</b>. If the preposterousness of this logic is not already clear, the identity of these protestors is not the concern – nor is it necessarily the common motive behind protests that brandish ‘Gays for Gaza’ signs. <b>These signs represent solidarity in support of Palestine</b> and, more specifically, Gazans. None of these signs show, for example, a desire to emigrate to Palestine. Even giving time to such an ‘argument’ is falling into a fallacious trap. Supporting something/someone does not always mean directly fighting side-by-side with such a thing/person – <b>this is quite literally the concept of foreign aid</b>. You could make the point that most of these protests in America are useless due to the U.S.’ longstanding and firm commitment to protecting the state of Israel, <b><i>but that is far from the point being made here</i></b>.
                </p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        <i>Gay people face staggering levels of persecution in both Gaza and the West Bank. Jail and sometimes even death awaits those who commit the “sin” of carnal knowledge with a member of the same sex.
                        </i>
                    </p>
                <p class="post-text">For some unknown reason, O'Neill does not put quotation marks around the words "<i>carnal knowledge</i>." It'd be more sensical to do so, as those words come from <a href="https://bwcimplementation.org/sites/default/files/resource/PS_Penal%20Code%20-%201936_EN.pdf">Section 152(2)(a)</a> of the criminal code of Mandatory Palestine, <b>which was inherited from British law</b>. The exact wording of such comes from the 1901 Queensland Criminal Code, which directly sources itself from the Indian Penal Code 1860, designed to <a href="https://www.jstor.org/stable/j.ctv512st2.7?mag=ismat-chughtais-quilt-and-queer-desire">‘<b>inculcate European morality into resistant masses</b>.’</a> The Queensland wording <a href="https://www.ohchr.org/sites/default/files/documents/cfi-subm/2308/subm-colonialism-sexual-orientation-cso-kaleidoscope-trust-input-2.pdf">can be found verbatim</a> in the current criminal codes of past British Empire countries, such as Kenya, Nigeria, and Uganda. It feels outlandish to attempt to single out Palestine in this matter, especially since, as I’ve stated in the past section, the current enforcement of such law (and the British Mandate criminal code as a whole) in Gaza is <b>questionable</b>.</p>
                <p class="post-text">
                However, <b>the West Bank ceased using the Mandatory Palestine criminal code when annexed by Jordan in 1951</b>, and Jordan’s 1951 criminal code <a href="https://www.hrw.org/sites/default/files/report_pdf/lgbt_mena0418_annex_0.pdf"><b>explicitly allows</b></a> same-sex relations/intercourse. Since then, the West Bank has not replaced such code. Of course, there is more to the picture, such as same-sex marriages and the rights of transgender individuals, but such is not what is being discussed.</p>
                <p class="post-text">This legality does not mean the social status of LGBTQ+ people is significantly better in the West Bank than in Gaza, but the broadness of “<i>Jail and sometimes even death awaits…</i>” can easily mislead someone who has not researched the subject – the West Bank and Gaza are far from the same, despite both being considered part of the Palestinian state. <b>This makes me question if O’Neill has done any research on the subject</b>.</p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        <i>[In 2022], 25-year-old Ahmad Abu Marhia, a gay man, was beheaded by thuggish homophobes in Hebron in the West Bank. Footage of this gruesome hate crime was uploaded to social media. At the time of his death, Mr Abu Marhia was <b>seeking asylum</b> in… you guessed it, Israel. That might be because, where Palestine was at number 130 on UCLA’s list of gay-friendly states, Israel was at number 44.
                        </i>
                    </p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        <i>Many gay Palestinians flee to Israel, usually to the famously flamboyant cities of Tel Aviv and Haifa. A few years ago, the Israeli gay-rights group Aguda estimated that around 2,000 LGBT people from Palestine live in Tel Aviv at any one time. The Jewish State gives them a haven from homophobia. It allows them to be their true selves. If they were to try that in Palestine, ridicule and violence would be their lot.
                        </i>
                    </p>
                <p class="post-text">Ahmad Abu Murkhiyeh was indeed murdered in Hebron, likely because he was gay. May he rest in peace. His unfortunate passing shows that, regardless if same-sex relations are legal in the West Bank, <b>societal acceptance still has a long way to go</b>. However, O’Neill fails to explain details in his story that are at least somewhat relevant.</p>
                <p class="post-text">Murkhiyeh was ‘seeking asylum’ in Israel, but saying only this simplifies the matter disingenuously. An already relatively <a href="https://www.timesofisrael.com/ghastly-murder-lays-bare-the-myriad-perils-for-lgbt-palestinians-fleeing-to-israel/">small amount</a> of gay Palestinians flee to Israel, and the process of obtaining a work permit for Palestinians requires being married (<i>same-sex marriage is not legal in Gaza nor the West Bank</i>) and above the age of 25, which Murkhiyeh barely was at the time of his death. There is, of course, another option, but it is morally questionable. This option, not offered to or accepted by many, is <b>collaborating with Israeli intelligence and working as an informant in exchange for permanent residency</b>. Murkhiyeh did not do any of these; instead, he was in Israel on a temporary permit that ultimately allowed him to seek asylum in Canada. It is a bit misleading not to include this detail, <b>especially when Canada is ranked fifth on that same UCLA list</b>.
                </p>
                <p class="post-text">Even with the kindness of a temporary permit, Murkhiyeh still struggled in Israel, going from shelter to shelter and sleeping on the streets when they’d no longer host him. Additionally, when he was in Israel, gay Palestinian asylum-seekers were yet to be allowed work permits, <b>forcing him to do the under-the-table work of prostitution</b>. In June of the year of his murder, the law finally opened the doors to asylum-seekers like him, but life was still full of strife; employers refused Murkhiyeh a stable job, so he resorted to <b>working low-paying jobs</b> meant for undocumented Palestinians. <b>None of this sounds like much of a ‘haven’; he most certainly received less torment for his sexuality, but his ethnicity made it harder to receive the same opportunities granted to Israelis</b>. Murkhiyeh had likely already experienced such discrimination during his time in the West Bank, as Israel has set up many checkpoints in the territory that limit the movement of Palestinians in the name of safety for Israeli settlers.</p>
                <p class="post-text">In a broader sense, though, this ‘haven’ is already extremely hard to get to because of Israel’s longstanding blockade of Gaza, <a href="https://www.hrw.org/news/2022/06/14/gaza-israels-open-air-prison-15"><b>restricting movement</b></a> for Gazans to an extreme. After October 7th, Gazans who were allowed to enter Israel on work permits <a href="https://jewishcurrents.org/gazan-workers-stuck-in-purgatory-after-israel-revokes-permits">had their permits revoked</a> and were barred from staying in Israel – but due to the siege and even tighter blockade on Gaza, they could not return home either. These people became classified as illegal aliens and were treated as such, being detained and interrogated on unfounded suspicions of terrorism. <b>Remind me again how this sounds like a ‘haven’?</b></p>
                <p class="post-text">
                    Again, LGBTQ+ Palestinians are <a href="https://www.radionetherlandsarchives.org/in-limbo-palestinian-gays/">stuck in an odd limbo</a> – <b>must they face persecution for being gay by the Palestinian Authority or Hamas, or should they avoid such persecution but do so at the cost of being discriminated against for being a Palestinian?</b> The risks of fleeing to Israel from Palestine have increased due to the hostility in the region, making the threat of deportation and/or detention without trial even more frightening for people looking to ‘be their true selves.’
                </p>
                <p class="post-text">Overall, Shaul Ganon of Aguda <a href="https://web.archive.org/web/20150128175015/http://www.globalpost.com/dispatch/news/regions/middle-east/israel-and-palestine/120607/gay-palestinians-lgbt-israel-conflict?page=0,1">put it best</a>:</p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        <i>Each side is trying to gain some points. The truth is <b>the only one who gets screwed by this is the Palestinian gays</b>.
                        </i>
                    </p>
                <p class="post-text">If Brendan O’Neill ever gets a chance to read this section of my article, I’d be happy to receive a response and engage in dialogue on this topic. There is a chance I am missing part of the story, and I am always open to feedback.
                </p>
            <h2 class="sub-heading" style="text-align: center;"> &mdash;&mdash; SIDETRACK END &mdash;&mdash;</h2>
            <p class="post-text">There is no need to deconstruct the second half of this quote from Bibi, as his attacking the intelligence of protestors without logical backing is simply an ad hominem. Frankly, my commentary above has already given far too much time to a logical fallacy.
            </p>
        <h2 class="sub-heading" id="nonseq">7. Israel as a Colonial State; Non-Sequitur Argumentation</h2>
            <p class="quote-text">
                <i class='bx bxs-quote-left'></i>
                <i>They call Israel a colonialist state. Don’t they know that the Land of Israel is where Abraham, Isaac, and Jacob prayed, where Isaiah and Jeremiah preached, and where David and Solomon ruled?</i>
            </p>
            <p class="post-text">Following the accounts of the Bible, the Quran, and Jewish oral traditions, his historical claims are true. But, I have a hard time finding the connection between the claim that “Israel is a colonialist state” and the completely non sequitur ‘rebuttal’ that Netanyahu provides. Claims that “Israel is a colonialist state” are not supported (nor, in this case, effectively rebutted) by historical accounts from antiquity – in fact, it would be disingenuous to argue that statehood in the times of Biblical-era antiquity is the same as statehood in the modern age. <b>This is why I am even more confused at the fact that what Netanyahu said led to another long standing ovation from Congress</b>.
            </p>
            <p class="post-text">If you are interested in the argument of Israel being a colonialist state and criticisms of such argument, <a href="https://en.wikipedia.org/wiki/Zionism_as_settler_colonialism#Citations">this Wikipedia article</a> has a surprising amount of good sources to read through on the matter, along with arguments that are more logical than Netanyahu's words above. But, frankly, that isn't very hard to beat.</p>
        <h2 class="sub-heading">Concluding Thoughts</h2>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/081424-netanyahu/bibi2.jpg" alt="" class="post-image-content">
            </div>
            <p class="image-caption">J. Scott Applewhite/AP</p>
            <p class="post-text">There are roughly seven more sections of my critique left to publish, and I hope to complete that by the middle of September. I hope to gain the energy to finish it with the utmost quality because some of Netanyahu's statements are physically painful to hear. Sometimes, I question why some people in power seem clueless – are they purposefully ignorant or involuntarily ignorant? <b>Is it even possible to be "involuntarily" ignorant as a politician?</b> On that topic, I'll probably have to write an article or two on a different topic before I complete the second part in order to cleanse my palate.</p>
            <p class="post-text">I feel that for even some die-hard Zionists in America, Netanyahu has entirely lost the plot. Is it this hard to make a logically sound argument in favor of Israel’s current actions in Palestine? On that note, it is a bit laughable that Biden seems to be quite buddy-buddy with Bibi (ex. forgetting about his "red line" of Israel invading Rafah) when it is quite apparent Trump winning the election will be much more convenient for Israel. Besides the fringe antisemitic far-right of the Republican Party, the GOP has always vehemently stood by Israel, and there isn’t nearly as much criticism coming from them as is coming from the Democrats. Netanyahu even visited Mar-a-Lago (Trump’s Florida estate) after this congressional address, despite Trump not sitting in any office. While you will hear <a href="https://www.aa.com.tr/en/middle-east/biden-tells-netanyahu-to-stop-escalating-tensions-in-region-report/3293762">rumors</a> of <a href="https://www.jpost.com/israel-hamas-war/article-813128">tensions</a> between <a href="https://apnews.com/article/biden-netanyahu-tensions-israel-hamas-bombs-67020b529db3dfe960654545766f52c1">Biden</a> and <a href="https://www.cnn.com/2024/04/03/politics/biden-netanyahu-tension-analysis/index.html">Bibi</a>, there are rarely any suspicions about Trump and Bibi’s positive relationship.</p>
            <p class="post-text">However, Biden isn’t even in the race anymore, which is excellent because it resulted in this incredibly awkward picture of Harris and the prime minister.
            </p>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/081424-netanyahu/bibiharris1.jpg" alt="" class="post-image-content">
            </div>
            <p class="post-text">Harris should probably begin seriously considering running on the platform of an arms embargo if she’s desperate to win Michigan, but that is another topic for another treatise.
            </p>
            <p class="post-text"><b>Readers, I hope all is well! Have a marvelous week.</b></p>
$ART_3$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  hero_image_url = EXCLUDED.hero_image_url,
  hero_image_caption = EXCLUDED.hero_image_caption,
  categories = EXCLUDED.categories,
  read_time = EXCLUDED.read_time,
  review_rating = EXCLUDED.review_rating,
  authors = EXCLUDED.authors,
  legacy_url = EXCLUDED.legacy_url,
  published = EXCLUDED.published,
  unlisted = EXCLUDED.unlisted,
  published_at = EXCLUDED.published_at,
  body_html = EXCLUDED.body_html;

-- 4. defyinglaw050124.html
INSERT INTO public.articles (
  slug,
  title,
  subtitle,
  hero_image_url,
  hero_image_caption,
  categories,
  read_time,
  review_rating,
  authors,
  post_type,
  legacy_url,
  published,
  unlisted,
  published_at,
  body_html
)
VALUES (
  'defyinglaw050124',
  'The Moral Dilemma of Defying Law for One’s Convictions',
  'Protestors vow more civil disobedience.',
  'assets/images/featured/blackpanthers-sacramento.jpg',
  'Members of the Black Panther Party occupying the California Capitol Building; May 2, 1967',
  ARRAY['Ethics', 'History', 'Politics']::text[],
  '9 min read',
  NULL,
  '[{"name":"Sosa","avatar_url":"assets/images/authors/sosaicon1.png"},{"name":"rawls","avatar_url":"assets/images/authors/rawlsicon1.jpg"}]'::jsonb,
  'standard',
  'articles/defyinglaw050124.html',
  true,
  false,
  '2024-05-01T12:00:00.000Z',
  $ART_4$
<h2 class="sub-heading">In a society governed by laws, individuals often find themselves at moral crossroads when faced with a conflict between their personal beliefs and the established legal framework.</h2>
        <h2 class="sub-heading"> The history of the world is built and based upon conflict and hierarchical struggle, whether it be between “[f]reeman and slave, patrician and plebeian, baron and serf, guild master and journeyman”, or simply put, “oppressor and oppressed”.</h2>
            <p class="post-text">Such conflict, and the vast developments in society that spur as a result, involve disobedience against the expectations of what the oppressor believes of their oppressed. The French Revolution beginning in 1789 did not occur in a vacuum; it was the culmination of major developments in individual belief, mainly attributed to the Enlightenment. This revolution of thought and ideals, pioneered by philosophers such as Immanuel Kant and John Locke, inspired individualism, empiricism, and rationalism, rather than the blind obedience of French feudal society. However, for such an expansive change in the fundamentals of France, the peasantry of the regime was forced to courageously work outside the law through civil disobedience; simple demands were largely ineffective, as the peasantry lacked any substantial political influence. </p>
            <p class="post-text">Though occurring more than two centuries ago, the French Revolution paints a picture of the methodology of future movements that involved resistance without regard for the opinion of authority. As a result, it can only be just to come to the conclusion that civil disobedience is not only morally and ethically just, it is also wildly more effective than the ideas of intelligent disobedience purported by Ted Thomas and Ira Chaleff in their essay titled “Moral Courage and Intelligent Disobedience”. Though the idea of moral courage is admirable, revolt is not as simple as enduring oppression.</p>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/050124-defyinglaw/stuartmill.jpg" alt="" class="post-image-content">
            </div>
        <p class="image-caption">John Stuart Mill and Harriet Taylor Mill</p>
        <h2 class="sub-heading">Defiance and Ethics</h2>
            <p class="post-text">At the heart of the moral dilemma lies whether it is justifiable to go against the law when one perceives it to be unjust. This notion echoes the teachings of moral philosophers such as Immanuel Kant, who argued for the supremacy of moral duty over legal obligation (Misselbrook). Kant’s deontological ethics emphasizes the importance of acting per moral principles, regardless of the consequences or societal norms. This, in itself, supports the idea of moral courage as a northern star for rebels to follow.</p>
            <p class="post-text">This was also seconded by philosophers such as John Stuart Mill, in his collection of Three Essays on Representative Government, Mill emphasized the impact of courage by stating “One person with a belief is a social power equal to ninety-nine who have only interests”. However, the utilitarian beliefs of Mill offer a more in-depth perspective, asserting that the morality of an action should be judged based on its overall utility or consequences.</p>
            <p class="post-text">From a utilitarian standpoint, disobeying unjust laws may be justified if it leads to greater happiness or reduces suffering in society. This relates heavily to historical instances of apartheid, segregation, and other divisive means of organizing society; revolting against such tools of oppression, even if illegal, reduces suffering for the majority of the participators of society (disregarding prejudice, which is irrational).</p>
        <h2 class="sub-heading">Historical Examples of Civil Disobedience</h2>
            <p class="post-text">Civil disobedience, popularized by figures like Mahatma Gandhi and Martin Luther King Jr, exemplifies the moral courage spoken of by Mill and Kant to challenge unjust laws peacefully; Gandhi’s campaign of nonviolent resistance against British colonial rule in India and King’s leadership in the Civil Rights Movement in the United States demonstrates the power of moral conviction in effecting social change. Gandhi famously stated, “An unjust law is itself a species of violence,” encapsulating the belief that individuals have a moral obligation to resist oppressive laws through nonviolent means. King similarly advocated for civil disobedience as a moral imperative, emphasizing the duty to confront injustice with righteous action. Although nonviolent protest was, at the time of King’s movement, technically in the framework of the law, ethically unjust policing and general misuse of constitutional law eroded those rights for those brave enough to challenge the segregationist status quo of the 1960s United States.</p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/050124-defyinglaw/blackpanthers-capitol2.jpeg" alt="" class="post-image-content">
                </div>
                    <p class="image-caption">Members of the Black Panther Party occupying the California Capitol Building; May 2, 1967</p>
            <p class="post-text">While civil disobedience can catalyze positive change, it also raises concerns about the rule of law and the potential consequences of challenging legal authority. In democratic societies, the rule of law is essential for maintaining order and protecting individual rights. An argument can be made for this when analyzing the acts of the Black Panther Party in the decade following its establishment; the Black Panther Party illegally carried weapons in May 1967 outside the California State Capitol. However, the legitimacy of the law is not absolute and may be subject to critique and reform. </p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/050124-defyinglaw/capitol-panthers-news.jpg" alt="" class="post-image-content">
                </div>
                    <p class="image-caption">News of members of the Black Panther Party occupying the California Capitol Building; May 2, 1967</p>
            <p class="post-text">Originally, the Black Panther Party carried their weapons legally in a form of protest against unjust police brutality in the state of California; it was this act of intelligent disobedience that caused at-the-time California governor Ronald Reagan to pass the Mulford Act, stripping them of their constitutional rights to a firearm in public (later supported by Texas’ constitutional carry belief) and forcefully switching their mode of protest to become civil disobedience. If a legal form of protest by vigilant citizens can alter interpretations of the United States Constitution in the blink of an eye, then what good is it to seek action in the confines of an unjust law if such laws will only be changed to frame the oppressed in a negative light?</p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/050124-defyinglaw/eugenedebs-mugshot.jpg" alt="" class="post-image-content">
                </div>
                    <p class="image-caption">Mugshot of Eugene V. Debs.</p>
            <p class="post-text">This argument is also rebutted by the case of Eugene Victor Debs and his experiences with imprisonment in World War I, showing that the struggles of the Panthers were not isolated events. The era of the war was a time of confusion for Americans, as the originally promised policy of neutrality crumbled after the White House received news of the Zimmerman Telegram, prompting a newfound conflict between Germany and the United States. After the declaration of war and passing of the Selective Service Act in 1917, the United States began a mass propaganda campaign on their home front; not only was this done to secure public support for the war and the draft, but also to prompt the beginning of the First Red Scare following the successful Bolshevik-led Russian Revolution of 1917. This was mainly led by three major powerful tools based on law: the creation of the Committee on Public Information (CPI), and the passing of the Espionage Act of 1917 and the Sedition Act of 1918.</p>
            <p class="post-text">The Espionage and Sedition Act outlawed any criticism of the United States government, the American war effort, and the draft, while the CPI regulated the circulation of war information in America. This “information” was riddled with anti-German sentiment, while also making an effort to suppress “anti-American” information -- at the time, “anti-American” was becoming synonymous with leftist and/or progressive political beliefs. Debs was a staunch socialist and union activist and opposed the United States' involvement in the war on the grounds of his moral beliefs (based in his politics). He displayed such opposition through a number of speeches criticizing Woodrow Wilson, the incumbent president. However, the government took extreme issue when he prepared and delivered a speech encouraging the public to resist the military draft. Such “radical”, “anti-American” sentiment not only led to Wilson branding Debs as a “traitor to his country”, but also enforcing that opinion into law by charging Debs with 10 counts of sedition.</p>
            <p class="post-text">During his sentencing, when given the opportunity to speak, Debs proclaimed,</p>
            <p class="quote-text">
                <i class='bx bxs-quote-left'></i>I said then, and I say now, that while there is a lower class, I am in it, and while there is a criminal element, I am of it, and while there is a soul in prison, I am not free.
            </p>
            <p class="post-text">Debs’ attempt to appeal this gross violation of First Amendment rights was not supported by the highest court in the nation either, regardless of the careful wording of his speeches to avoid conviction; yet, Debs still felt hope for the oppressed and even ran for prison while behind bars. His case is one similar to the Black Panther Party; despite attempts to protest against unjust law, the oppressor found a way to paint the oppressed in a negative light, therefore forcing acts of civil disobedience into existence.</p>
        <h2 class="sub-heading">Modern Whistleblowing</h2>
            <p class="post-text">In today’s interconnected world, activists and whistleblowers often find themselves grappling with the decision to expose wrongdoing or challenge institutionalized injustice, knowing that they may face legal repercussions for their actions.</p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/050124-defyinglaw/snowdenscreen.jpg" alt="" class="post-image-content">
                </div>
                    <p class="image-caption">A photo of Edward Snowden speaking to The Council of Europe's parliamentary assembly through video chat from Moscow.</p>
            <p class="post-text">The case of Edward Snowden, who leaked classified information about government surveillance programs, exemplifies the tension between national security concerns and individual privacy rights. In releasing these records to the public, Snowden knew he would provoke the full force of United States law, leading him to flee to Russia to escape prosecution before his crime. Snowden’s actions sparked a global debate about government transparency and the balance between security and civil liberties, raising important ethical questions about the limits of state power and the duty to uphold constitutional principles. Snowden took actions he thought were correct and did so in isolation at the expense of his social and personal life. He is the objective definition of moral courageousness, as well as one of the most impactful cases of civil disobedience in recent U.S. history. His actions drew a rift in the American populace, with some seeing his actions as vile and treacherous, while others saw him as a pillar of moral righteousness.</p>
        <h2 class="sub-heading">Elouise Cobell and the Unfortunate Shortcomings of Intelligent Disobedience</h2>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/050124-defyinglaw/elouisecobell-funeral.jpg" alt="" class="post-image-content">
            </div>
                <p class="image-caption">The funeral of Elouise Cobell.</p>
            <p class="post-text">However persistent one may be, an argument can be made about the citizens who follow the law, almost to a fault. In the case of Eloise Cobell, she followed the law through her demise. At great risk to her health, both mental and physical, she never resorted to illicit actions to make the government take her seriously. Although it can and will be argued that if Cobell could remain on the side of the law, why can others not, even when their grievances are not nearly as ‘paramount’ as her own?</p>
            <p class="post-text">In response, I simply raise that it isn’t that simple. Not only are many cases of civil disobedience led by movements rather than singular people, but the fact in the matter is that legal cases in the current U.S. justice system take too long to help the correct people. Cobell’s original case, Cobell v. Salazar was originally started on June 10th, 1996. Cobell won the case in November of 2010, with the Federal District Court of Washington D.C. giving it the final seal of approval on June 21, 2011. Government checks were distributed over the Christmas holidays to the Natives but unfortunately, between the time of the settlement and the checks finally being distributed, Cobell had succumbed to her battle with cancer.</p>
                <div class="image-post-wrapper">
                    <img src="assets/images/articles/050124-defyinglaw/brummy-crusade.jpg" alt="" class="post-image-content">
                </div>
                <p class="image-caption">A photo from the Children's Crusade in Birmingham, specifically of police dogs attacking demonstrators. Photo obtained from the National Museum of African African History & Culture.</p>
            <p class="post-text">In stark contrast, the modern Civil Rights Movement brought forth change almost instantly. African Americans across the country participated in acts of civil disobedience, boycotting busses, hosting sit-ins, and being willingly incarcerated to protest the treatment of Black people in America. On May 3rd, 1963, child protestors were bitten by police dogs and sprayed with firehoses. This was known as the Birmingham Children’s Crusade, sparking mass uproar, and is noted as the final push in a change to civil rights as we know it. This culminated in the passing of the Civil Rights Act of 1964, only a year and a month later. Though both Cobell and MLK were morally justified in their combatance of the U.S. government, there is a clear distinction in effectiveness. It is objectively unjust for people to die fighting for an unjust law, especially when there is a simple resolution. Civil disobedience is inherently moral, as it effectively conflicts with unethical standpoints and motions.</p>
        <h2 class="sub-heading">Conclusion</h2>
            <p class="post-text">In conclusion, the moral implications of defying the law for something one believes to be right are multifaceted and inherently complex. While individuals may be motivated by a sense of moral duty or a commitment to justice, they must also consider the broader societal consequences of their actions and the potential conflicts between legal and moral principles. Ethical theories such as deontology and utilitarianism offer valuable frameworks for evaluating the morality of disobedience, while historical examples of civil disobedience provide inspiration and guidance for confronting injustice peacefully. Ultimately, navigating the moral dilemma of defying the law requires thoughtful reflection, ethical discernment, and a steadfast commitment to principles of justice and human rights.</p>
            <hr>
            <h2 class="sub-heading">Further Reading</h2>
                <p class="source">Bloom, Joshua, and Waldo E. Martin. <i>Black against Empire: The History and Politics of the Black Panther Party</i>. University Of California Press, 2013.
                <p class="source">Chomsky, Noam. “Totalitarian Culture in a Free Society.” <i>Internet Archive</i>, 1 Oct. 1993, <a href="https://archive.org/details/NoamChomsky-TotalitarianCultureInAFreeSociety-1993">archive.org/details/NoamChomsky-TotalitarianCultureInAFreeSociety-1993.</a> Accessed 1 May 2024.
                <p class="source">Debs, Eugene V. “Speech of Sedition.” <i>Wikisource.org</i>, Wikimedia Foundation, Inc., 16 June 1918, <a href="https://en.wikisource.org/wiki/Debs%27_Speech_of_Sedition">en.wikisource.org/wiki/Debs%27_Speech_of_Sedition.</a>
                <p class="source">---.“Statement to the Court, upon Being Convicted of Violating the Sedition Act.” <i>Www.marxists.org</i>, 18 Sept. 1918, <a href="https://www.marxists.org/archive/debs/works/1918/court.htm">www.marxists.org/archive/debs/works/1918/court.htm.</a>
                <p class="source">“Eugene Debs in Jail.” <i>The Washington Post</i>, 1 July 1918, p. 1, <a href="https://www.newspapers.com/article/the-washington-post-eugene-debs-in-jail/115358863/">www.newspapers.com/article/the-washington-post-eugene-debs-in-jail/115358863/.</a>
                <p class="source">Garrett, Jan. “Thomas Aquinas on Law.” <i>Wku.edu</i>, 1225, <a href="https://people.wku.edu/jan.garrett/302/aquinlaw.htm">people.wku.edu/jan.garrett/302/aquinlaw.htm.</a>
                <p class="source">Janko, Melinda. "Elouise Cobell: A Small Measure of Justice." <i>American Indian Magazine</i>, summer 2013, pp. 25-29.
                <p class="source">Koch, Peter. “How Should We Balance Morality and the Law? - Baylor College of Medicine Blog Network.” <i>Baylor College of Medicine Blog Network</i>, 20 Dec. 2019, <a href="https://blogs.bcm.edu/2019/12/20/how-should-we-balance-morality-and-the-law/">blogs.bcm.edu/2019/12/20/how-should-we-balance-morality-and-the-law/.</a>
                <p class="source">Marx, Karl, and Friedrich Engels. <i>The Communist Manifesto</i>. Workers’ Educational Association, 1848.
                <p class="source">Mill, John Stuart. <i>On Liberty ; Representative Government ; the Subjection of Women</i>. Oxford University Press, 1975.
                <p class="source">Misselbrook, David. “Duty, Kant, and Deontology.” <i>British Journal of General Practice</i>, vol. 63, no. 609, Apr. 2013, pp. 211–11, <a href="https://doi.org/10.3399/bjgp13x665422">doi.org/10.3399/bjgp13x665422.</a>
                <p class="source">Myers, Peter C. “The Limits and Dangers of Civil Disobedience: The Case of Martin Luther King, Jr.” <i>The Heritage Foundation</i>, 29 Dec. 2017, <a href="https://www.heritage.org/civil-society/report/the-limits-and-dangers-civil-disobedience-the-case-martin-luther-king-jr">www.heritage.org/civil-society/report/the-limits-and-dangers-civil-disobedience-the-case-martin-luther-king-jr.</a>
                <p class="source">Pearson, Hugh. <i>Shadow of the Panther</i>. Addison Wesley Publishing Company, 1994.
                <p class="source">Thomas, Ted, and Ira Chaleff. "Moral Courage and Intelligent Disobedience.'<i>InterAgency Journal</i>, vol. 8, no. 1, winter 2017, pp. 58-66.
                </p>
$ART_4$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  hero_image_url = EXCLUDED.hero_image_url,
  hero_image_caption = EXCLUDED.hero_image_caption,
  categories = EXCLUDED.categories,
  read_time = EXCLUDED.read_time,
  review_rating = EXCLUDED.review_rating,
  authors = EXCLUDED.authors,
  legacy_url = EXCLUDED.legacy_url,
  published = EXCLUDED.published,
  unlisted = EXCLUDED.unlisted,
  published_at = EXCLUDED.published_at,
  body_html = EXCLUDED.body_html;

-- 5. genderdisparities011625.html
INSERT INTO public.articles (
  slug,
  title,
  subtitle,
  hero_image_url,
  hero_image_caption,
  categories,
  read_time,
  review_rating,
  authors,
  post_type,
  legacy_url,
  published,
  unlisted,
  published_at,
  body_html
)
VALUES (
  'genderdisparities011625',
  'Ignorance or Irrationally: Gender Disparities in Mental Health Diagnoses',
  '"Girls are taught to be perfect, boys are taught to be brave."',
  'assets/images/featured/mentalhealth-cottonbro.jpg',
  'cottonbro studios via Pexels',
  ARRAY['Ethics']::text[],
  '9 min read',
  NULL,
  '[{"name":"Antoné","avatar_url":"assets/images/authors/antoneicon1.jpg"}]'::jsonb,
  'standard',
  'articles/genderdisparities011625.html',
  true,
  false,
  '2025-01-13T12:00:00.000Z',
  $ART_5$
<p class="post-text">
            According to Robin N. Hamilton, an Emmy-award-winning television host and founder of the ‘ARound Robin Company’, gender equality is the idea that everyone, regardless of gender, has equal access to resources and opportunities; these opportunities include access to education, economic participation, and independence, and political participation and representation. <b>However, as a society, we still have faults when it comes to complete gender equality</b>. These inequalities can be traced back to as early as the Neolithic or Copper Age excavations, displayed by the differences in graves; not only were male graves more prominent, but they contained more “valuable” possessions, such as weapons <a href="#1" class="textdecor"><sup>1</sup></a>. These burial differences among other factors indicated that gender differences arose from cultural practices rather than biological factors. Thus, this shows that gender inequality is deeply rooted in human culture, having less to do with societal stereotypes (claimed to have a basis in science) and more with cultural values and customs. These same gender ‘biases’ can be seen in the psychological situation of today, concerning the disparities in the diagnoses of certain psychiatric conditions based on gender stereotypes and lack of regard for female and male presentation of certain disorders. These psychiatric conditions include but are not limited to, attention-deficit/hyperactive disorder (ADHD), autism spectrum disorder, and conditions under the umbrella of depression.
        </p>
        <h2 class="sub-heading">Context Behind These Conditions</h2>
            <p class="post-text">
                Dr. Kristalyn Salters-Pedneault, a clinical psychologist and associate professor at Eastern Connecticut State University, describes a psychiatric disorder as a “mental illness diagnosed by a mental health professional that greatly disturbs your thinking, moods, and/or behavior and <b>seriously increases your risk of disability, pain, death, or loss of freedom</b>.”<a href="#2" class="textdecor"><sup>2</sup></a> Symptoms of psychiatric disorders include confused thinking, inability to manage day-to-day stress, and trouble understanding situations and other people, in addition to a plethora of other traits.  Many categories fall under the umbrella of psychiatric disorders including neurodevelopmental disorders and depressive disorders <a href="#2" class="textdecor"><sup>2</sup></a>. Despite these debilitating symptoms, though, there is still a gap in diagnoses of certain conditions present in relevance to gender.
            </p>
            <p class="post-text">
                According to the Children and Environment sector of the Environmental Protection Agency, “Neurodevelopmental disorders are disabilities associated primarily with the functioning of the neurological system and brain”.<a href="#3" class="textdecor"><sup>3</sup></a> The two main neurodevelopmental disorders that present a major gender disparity are ADHD and autism.
            </p>
            <p class="post-text">
                Regarding ADHD, there are three major types: hyperactive/impulsive, inattentive, and combination.<a href="#4" class="textdecor"><sup>4</sup></a> The hyperactive/impulsive type displays symptoms of hyperactivity but not necessarily inattention. The inattentive type is exactly the opposite of the former, manifesting as inattention but not hyperactivity. This form of ADHD was formerly called attention-deficit disorder (ADD), but this term has recently been deemed outdated. The last type, combination, involves symptoms of both inattention and hyperactivity. Before we begin to observe gender in this stratosphere, it is important to note that <b>any individual can have any of the three forms of ADHD, regardless of gender</b>.<a href="#4" class="textdecor"><sup>4</sup></a>
            </p>
            <h2 class="sub-heading">The Gender Gap: ADHD</h2>
            <div class="post-image-wrapper">
                <img src="assets/images/featured/mentalhealth-cottonbro-3jpg.jpg" alt="" class="post-image-content">
            </div>
            <p class="image-caption">cottonbro studios via Pexels</p>
            <p class="post-text">
                The diagnosis gap between boys and girls ages 5 to 17 from 1997 to 2021 is wide, with the percent difference between the two genders being <b>at least 5%</b>.<a href="#3" class="textdecor"><sup>3</sup></a> A major reason why male ADHD is more ‘prevalent’ is because ADHD was initially defined based on hyperactive males. This is significant because of the way females typically present ADHD; they are more likely to present as inattentive. This inattention manifests in a variety of ways that can easily be ignored. These manifestations include disorganization, excessive tardiness, hypersexuality, repetitive behaviors that focus on the body – skin picking, leg bouncing, nail-biting– and perfectionism.<a href="#4" class="textdecor"><sup>4</sup></a> On the other hand, male manifestations are demonstrated outwardly in the form of disruptive, aggressive, or high-risk behaviors. This contrasting exhibition of ADHD is why men tend to be<b> diagnosed more often than women</b>.
            </p>
            <p class="post-text">
                There are various repercussions to this diagnosis discrepancy. Namely, a lack of diagnosis in childhood can lead to greater struggles in adulthood. The lack of development of proper coping skills due to ignorance of needs in adolescence will manifest as dysfunction and disorganization later in life.<a href="#4" class="textdecor"><sup>4</sup></a>
            </p>
            <h2 class="sub-heading">The Gender Gap: Autism</h2>
            <p class="post-text">
                Autism is another condition that presents some of the same challenges as the aforementioned disorder, ADHD. The National Institute of Mental Health describes Autism as “a neurological and developmental disorder that affects how people interact with others, communicate, learn, and behave.”<a href="#5" class="textdecor"><sup>5</sup></a> Autism is a spectrum condition, meaning that individuals share some of the same traits but they are highly idiosyncratic in their needs, interests, and preferences <a href="#6" class="textdecor"><sup>6</sup></a>. Autism is diagnosed 3 to 4 times more often in males compared to females and it typically takes 1.8 more years, on average, for females to receive a diagnosis after concerns are first raised by adults in their lives, such as parents or teachers <a href="#6" class="textdecor"><sup>6</sup></a>.
            </p>
            <p class="post-text">
                Various theories may explain why this gender gap exists. For one, <b>autistic girls present symptoms differently than the “typical” way we as a society tend to think about autism</b> <a href="#6" class="textdecor"><sup>6</sup></a>. This <b>stereotypical</b> thought process is the main culprit as to why female autism often gets overlooked. For instance, autistic children often have very intense fixations, and males are typically interested in things such as trains or buses <a href="#6" class="textdecor"><sup>6</sup></a>. However, autistic girls also have very intense interests but their interests are often similar to girls their age, which may overshadow the severe intensity of the fixation and can be written off as “girls being girls”. Additionally, due to social expectations, <b>girls often mask their autism</b> to not cause a disruption and to attempt to fit into the societal perception of females being more shy <a href="#6" class="textdecor"><sup>6</sup></a><a href="#7" class="textdecor"><sup>7</sup></a>. This perception of females is also why autistic girls are diagnosed with much higher levels of mental health problems such as depression or personality disorders <a href="#6" class="textdecor"><sup>6</sup></a>. In some cases, healthcare providers have dismissed female autistic traits as the aforementioned conditions, on account of gender bias or blatant ignorance <a href="#7" class="textdecor"><sup>7</sup></a>.
            </p>
            <p class="post-text">
                A continuing pattern of a lack of regard for the female presentation of a diagnosis is ever present in the case of ASD. According to Brickhill, “gender bias has likely <b>filtered into academic research</b> . . ., as the current diagnostic tools for autism are believed to be geared towards the male autism phenotype.”<a href="#7" class="textdecor"><sup>7</sup></a> As a society, if we begin to look at certain conditions through an unbiased lens, we can begin to remedy the turmoil our lack of regard has caused. In a survey by Dr. Laura Hull of University of Bristol, 85% of autistic women said their lives were easier and better since getting a diagnosis.<a href="#6" class="textdecor"><sup>6</sup></a> Our ability to improve the lives of those affected by these conditions should drive us to be more attentive to all individuals.
            </p>
            <h2 class="sub-heading">The Gender Gap: Depression</h2>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/011625-mentalhealth/sprc-graph.png" alt="" class="post-image-content">
            </div>
            <p class="image-caption">Mental Health and Suicide History of Suicide Decedents in 46 States by Gender; data from the <a href="https://wisqars.cdc.gov/nvdrs/">CDC</a>, data compiled by the <a href="https://sprc.org/about-suicide/scope-of-the-problem/suicide-and-serious-mental-illness/">SPRC</a></p>
            <p class="post-text">
                While it may appear that research only focuses on the lack of regard for female presentations of certain conditions, there is an unignorable neglect of the male presentation of a certain condition: depression. According to the Anxiety & Depression Association of America, “nearly 1 in 10 men experience depression or anxiety but less than half will receive treatment, and more than 4 times as many men as women die by suicide every year.”<a href="#9" class="textdecor"><sup>9</sup></a> While it is important to note that there is no direct ratio between suicide and depression, the link demonstrates that “depression is one of suicides’ most significant risk factors.” <a href="#8" class="textdecor"><sup>8</sup></a> Males' symptoms of depression are often vastly different from that of females. They may exhibit escapist, risky, or controlling behaviors.<a href="#9" class="textdecor"><sup>9</sup></a> These behaviors are often not seen as problematic due to society's perceived ideals of men. It is also important to recognize that, “[a]lthough women attempt suicide more often than men do, <b>men are more likely to complete suicide</b>”, because of their lack of expression of warning signs and their impulsivity to act on suicidal thoughts.<a href="#9" class="textdecor"><sup>9</sup></a>
            </p>
            <p class="post-text">
                The diagnosis disparity demonstrated by male depression rates reeks of a very similar substance to the aforementioned data on female ADHD and Autism. The main factor that prevents society from recognizing males and struggles is the perceived idea of masculinity. Traditional Western ideals of masculinity established the standards of self-reliance and emotional control. Society has further reinforced these ideals by teaching boys to express their emotions dissimilarly to that of female expression.<a href="#8" class="textdecor"><sup>8</sup></a> This is even true in the medical setting as “[p]articipants in studies conducted before major depressive disorder (MDD) was included in the Diagnostic and Statistical Manual of Mental Disorders in 1980 were predominantly female.”<a href="#8" class="textdecor"><sup>8</sup></a> When studies began to account for “male-typical” depressive symptoms such as substance misuse, aggression, and overworking, “the difference in rates of depression between the sexes disappeared.”<a href="#8" class="textdecor"><sup>8</sup></a> As we work towards acknowledging the feelings of males through a non-stereotypical lens, we will begin to foster an environment that makes speaking out and seeking help less of a daunting task.
            </p>
            <h2 class="sub-heading">What Is To Be Done?</h2>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/011625-mentalhealth/bille-jean-king-1970.jpg" alt="" class="post-image-content">
            </div>
            <p class="image-caption">Billie Jean King playing at the 1970 US Open in Forest Hills. Photo owned by Ed Fernberger Collection of the International Tennis Hall of Fame.</p>
            <p class="post-text">
                <b>“Girls are taught to be perfect, boys are taught to be brave,”</b> said Presidential Medal of freedom recipient and Grand Slam Title holder Billie Jean King.<a href="#10" class="textdecor"><sup>10</sup></a> This quote remains painfully true when we take a look at society's treatment of mental health conditions in relevance to gender. Jean King founded various organizations –such as the Women's Tennis Association– thus becoming a crucial activist in the fight for gender equality in the realm of professional tennis. However, this fight for equal opportunity is still ever present in our society, namely in the circumstance of clinical psychology.
            </p>
            <p class="post-text">
                The information presented leaves one substantial question: What can we do to remedy the issues caused by a long-standing irresponsibility regarding gender in the landscape of clinical psychology? <b>The answer is equity</b>. Equity focuses on uplifting people based on their varying material conditions and adjusting for those imbalances to provide equal opportunity. Providing gender equity in a long-established pattern of disproportionate awareness of psychological presentation — based on gender — of mental health conditions is the first step to remedying the imbalance presented in today’s psychological situation.
            </p>
                <h2 class="sub-heading" style="font-style: italic;margin-top: 3.5rem;">Further Reading</h2>
                    <p class="source"><sup id="1">1</sup> Hamilton, Robin N. “The Origin, History and Importance of Gender (In) Equality.” ARound Robin Production Company, August 8, 2023. <a href="https://www.aroundrobin.com/importance-of-gender-equality/">aroundrobin.com/importance-of-gender-equality.</a></p>
                    <p class="source"><sup id="2">2</sup> Salters-Pedneault, Kristalyn. “Types of Psychiatric Disorders.” Verywell Mind, August 22, 2023. <a href="https://www.verywellmind.com/psychiatric-disorder-definition-425317/">verywellmind.com/psychiatric-disorder-definition-425317.</a></p>
                    <p class="source"><sup id="3">3</sup> United States Environmental Protection Agency. “Health - Neurodevelopmental Disorders.” EPA.gov, May 29, 2015. <a href="https://www.epa.gov/americaschildrenenvironment/health-neurodevelopmental-disorders">epa.gov/americaschildrenenvironment/health-neurodevelopmental-disorders.</a></p>
                    <p class="source"><sup id="4">4</sup> The ADHD Centre. “Female vs Male ADHD.” The ADHD Centre, December 21, 2022. <a href="https://www.adhdcentre.co.uk/female-vs-male-adhd/#">adhdcentre.co.uk/female-vs-male-adhd/#.</a></p>
                    <p class="source"><sup id="5">5</sup> National Institute of Mental Health. “Autism Spectrum Disorder.” National Institute of Mental Health, 2024. <a href="https://www.nimh.nih.gov/health/topics/autism-spectrum-disorders-asd">nimh.nih.gov/health/topics/autism-spectrum-disorders-asd.</a></p>
                    <p class="source"><sup id="6">6</sup> Hull, Laura. “The Gender Gap in Autism.” Ambitious about Autism, March 31, 2023. <a href="https://www.ambitiousaboutautism.org.uk/about-us/media-centre/blog/girls-and-autism/gender-gap-autism">ambitiousaboutautism.org.uk/about-us/media-centre/blog/girls-and-autism/gender-gap-autism.</a></p>
                    <p class="source"><sup id="7">7</sup> Brickhill, Rae, Gray Atherton, Andrea Piovesan, and Liam Cross. “Autism, Thy Name Is Man: Exploring Implicit and Explicit Gender Bias in Autism Perceptions.” PLOS ONE 18, no. 8 (August 23, 2023): e0284013–13. <a href="https://doi.org/10.1371/journal.pone.0284013">doi.org/10.1371/journal.pone.0284013.</a></p>
                    <p class="source"><sup id="8">8</sup> Swetlitz, Nathan. “Depression’s Problem with Men.” AMA Journal of Ethics 23, no. 7 (July 1, 2021): E586-589. <a href="https://doi.org/10.1001/amajethics.2021.586">doi.org/10.1001/amajethics.2021.586.</a></p>
                    <p class="source"><sup id="9">9</sup> Anxiety & Depression Association of America. “Men’s Mental Health.” adaa.org, January 5, 2023. <a href="https://adaa.org/find-help/by-demographics/mens-mental-health">adaa.org/find-help/by-demographics/mens-mental-health.</a></p>
                    <p class="source"><sup id="10">10</sup> Billie Jean King Enterprises. “Women’s Equal Rights in Sports.” Billie Jean King Enterprises, 2014. <a href="https://www.billiejeanking.com/equality/">billiejeanking.com/equality/.</a></p>
$ART_5$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  hero_image_url = EXCLUDED.hero_image_url,
  hero_image_caption = EXCLUDED.hero_image_caption,
  categories = EXCLUDED.categories,
  read_time = EXCLUDED.read_time,
  review_rating = EXCLUDED.review_rating,
  authors = EXCLUDED.authors,
  legacy_url = EXCLUDED.legacy_url,
  published = EXCLUDED.published,
  unlisted = EXCLUDED.unlisted,
  published_at = EXCLUDED.published_at,
  body_html = EXCLUDED.body_html;

-- 6. hagopianreview031325.html
INSERT INTO public.articles (
  slug,
  title,
  subtitle,
  hero_image_url,
  hero_image_caption,
  categories,
  read_time,
  review_rating,
  authors,
  post_type,
  legacy_url,
  published,
  unlisted,
  published_at,
  body_html
)
VALUES (
  'hagopianreview031325',
  'Review: Chapter 1 from <i>Pedophilia & Empire: Satan, Sodomy, & The Deep State</i>',
  'This chapter is as a perfect example of misguided anger in politics, especially regarding conspiratorial hysteria.',
  'assets/images/featured/hagopian-cover-1.jpg',
  NULL,
  ARRAY['Media', 'Politics']::text[],
  '7 min read',
  2,
  '[{"name":"Sosa","avatar_url":"assets/images/authors/sosaicon1.png"}]'::jsonb,
  'standard',
  'articles/hagopianreview031325.html',
  true,
  false,
  '2025-03-13T12:00:00.000Z',
  $ART_6$
<h2 class="sub-heading">Content warning for discussions of pedophilia and child sexual abuse.</h2>
        <p class="post-text">
            To be fair, when I first read the title of this book, I was stumbling around a site with a vast archive of literature (GoodReads); this title stuck out to me as one that was a bit more deranged than the books I usually come across. This derangement was something that drew me in, though, and I decided to give this a shot.
        </p>
            <p class="post-text">
                This chapter reads to me as written from the perspective of someone with <b>misplaced anger</b>, particularly in the case of the politics of the United States; a strong anger toward the "elite" but an <b>allegiance with American conservatives/Republicans</b>, despite such group supporting and being part of this "elite." From their view, the "elites" include the Democrats and the influence of the Israeli government/intelligence. In reality, though, it is both parties that have interests directly conflicting with the interests of the working masses, and it is both parties that are influenced by the ideas of the Israeli government (in terms of foreign policy).
            </p>
            <p class="post-text">
                <b>Let me quickly make an important note</b>: I am not saying "Israel" to refer to "Israeli citizens" as a whole, nor am I referring to "Jewish people". I am using "Israel" to strictly refer to the Israeli government; as of now, I criticize the Israeli government under Netanyahu. This criticism is not toward Israeli citizens as a whole; my criticism of Israel is also not an attack of Jewish people nor Judaism, as that would be antisemitic.
            </p>
            <p class="post-text">
                Back on topic: this misplaced anger bleeds through this chapter's very detailed and well-written discussion of pedophilia. Joachim Hagopian approaches this topic of pedophilia with <b>a surprising amount of care and thoroughness</b>, approaching it in a such a way that is quite controversial to many; this "way" that is controversial is the "way" where one views people suffering from pedophilic thoughts as humans and not generalizing all of them as criminals, freaks, etc. Sure, pedophilia is not something to be normalized, but destigmatization is a great way to encourage people suffering from such thoughts to seek help, and Hagopian covers this quite well.
            </p>
            <p class="post-text">
                However, this eloquent commentary is spoiled by this misplaced anger making early subtle appearances until fully exposing itself at the end of the chapter. Mentions of Pizzagate (while citing himself?) and referring to such as a <b>"documented scandal"</b> among many "others" was quite the red flag for me, but the alarm bells truly rang when I read Hagopian blaming the destruction of free speech (specifically, speech that is <b>anti-LGBT</b>) in the United States on the "Politically Correct Gestapo thought police." In the real world, of course, the State Department couldn't care less about cracking down on racist, homophobic, xenophobic, or transphobic rhetoric. Instead, they tend to focus more on suppressing anti-imperialist, (actual) left-leaning, and anti-capitalist rhetoric -- <b>rhetoric that is truly anti-"elite"</b>. This actually documented suppression of ideas and revolutionary sentiment among common people was rampant in the Cold War era, but had its moments during World War I. For example, in the Cold War era, we saw at first "legal" but eventual violent crackdown on the Black Panther Party (BPP), through actions such as Governor Reagan's anti-BPP gun control and the assassinations of figures in the party such as Fred Hampton<a href="#1" class="textdecor"><sup>1</sup></a>. In World War I, we saw this with the arrest and imprisonment of Eugene V. Debs for opposing the military draft in a speech, despite beginning by saying<a href="#2" class="textdecor"><sup>2</sup></a>,   </p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/031325-hagopian/eugene-debs-ohio-1.jpg" alt="" class="post-image-content">
                </div>
                <p class="image-caption">Eugene V. Debs delivering a speech in Canton, Ohio; this speech was the one that led to his arrest and imprisonment.</p>
             <p class="quote-text">
                <i class='bx bxs-quote-left'></i>I realize that, in speaking to you this afternoon, there are certain limitations placed upon the right of free speech. I must be exceedingly careful, prudent, as to what I say, and even more careful and prudent as to how I say it. I may not be able to say all I think; but I am not going to say anything that I do not think.
            </p>
                <p class="post-text">
                    The two examples above do not include conservative or right-wing ideologues being violently suppressed by all branches of the law; this is because conservative or right-wing ideologies (mostly) are not directly at odds with the ideology of the United States. This does not seem apparent to Hagopian, though. This ignorance of the author is only made clearer when he begins to get side-tracked and writes of his own takes on the Diagnostic and Statistical Manual from his own experiences as a mental health therapist. He calls the Manual <b>"neither ... accurate nor fair"</b> but rather
                </p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>an artificial social and political construct elevated to an undeserving pedestal status, given far too much credence to pseudo-science dogma for sole benefit of the medical and psychiatric establishment and institutionalized hierarchical corruption.
                    </p>
                <p class="post-text">
                    It seems that Hagopian has forgotten the direction he took earlier in the chapter that made his commentary so great to read: rather than making many assertions without context/evidence, much evidence and interpretations of such evidence was presented. In contrast, after making these assertions about the Manual, there is little elaboration on his claims; all the reader is given is implications that doctors purposefully over-diagnose and/or over-medicate people in the name of Big Pharma, and that all conditions should not be treated as <b>"a quick biochemical fix."</b> While I agree that the treatment of mental conditions should never only consist of medication (therapy is quite the heavy lifter in terms of treatment), medication can still be quite the "fix" for many. Of course, Big Pharma is an industry depraved by greed, but this does not disprove the efficacy and use of many medications that have been, unfortunately, terribly price gouged by this broken industry.
                </p>
                <p class="post-text">
                    Constant mentions of the "Illuminati government" only made me cringe while reading this. In completing this chapter, Hagopian references this "top 1%" <b>oh-so-ominous power</b> as being responsible for massive amounts of sex trafficking of children. While the initial sentiment is correct -- <b>the richest people on the planet control the planet, and some seem to engage in these horrendous acts</b> -- it is riddled with errors that break down the structure of Hagopian's ideas. The "top 1%" globally is not the oppressors of the masses; many earning ~$70,000 in the United States are struggling to live a comfortable life, but they still earn enough to put them in the top 1% globally<a href="#3" class="textdecor"><sup>3</sup></a>. This is why I do not enjoy using statistics loosely to refer to Hagopian's "elite"; instead, "capitalists" seems like a better word to use. Another error that kills any semblance of taking Hagopian seriously is his mention of these "elites" particpating in child sex trafficking to "strengthen their satanic power." I've truly no words on such a claim.
                </p>
                <p class="post-text">
                    Writings like these are phenomenal examples of how, through cultural hegemony, <b>the bourgeoisie is able to guide the frustration of the public elsewhere</b>. Why be mad about capitalist exploitation when you could be mad at some of the capitalists for reasons quite disconnected from reality? Narratives like these only strengthen the two-party system in the United States, as both parties driven by capitalist interests seem to only disagree about social policy. Of course, the social policy they disagree on will only ever just affect the working public, as even despite 45/47th president Donald Trump's transphobic rhetoric, transgender millionaire Caitlyn Jenner was told by him that she could use any bathroom in the Trump Tower<a href="#4" class="textdecor"><sup>4</sup></a>. Odd, isn't it?
                </p>
                <p class="post-text">
                    Ultimately, the erratic writing of this chapter has me drawn to read more of this book -- not out of genuine intellectual interest, but out of a very morbid curiosity. <b>How worse could it get?</b>
                </p>
                <h2 class="sub-heading" style="font-style: italic;margin-top: 3.5rem;">Further Reading</h2>
                    <p class="source"><sup id="1">1</sup> Aiken, Joshua. “What the Panthers Meant by Self-Defense: Race, Violence, and Gun Control.” Duke Center for Firearms Law, 9 Aug. 2022, <a href="https://firearmslaw.duke.edu/2022/08/what-the-panthers-meant-by-self-defense-race-violence-and-gun-control">firearmslaw.duke.edu/2022/08.</a></p>
                    <p class="source"><sup id="2">2</sup> Debs, Eugene V. “Speech in Canton, Ohio.” Archives.gov, Documented Rights Exhibit, 16 June 1918, <a href="www.archives.gov/exhibits/documented-rights/exhibit/section3/detail/debs-speech-transcript.html">www.archives.gov/exhibits/documented-rights/exhibit/section3/detail/debs-speech-transcript.</a></p>
                    <p class="source"><sup id="3">3</sup> Giving What We Can. “How Rich Am I?” Givingwhatwecan.org, Giving What We Can, 2024, <a href="www.givingwhatwecan.org/how-rich-am-i?income=70000&countryCode=USA&numAdults=1&numChildren=0">www.givingwhatwecan.org/how-rich-am-i.</a> see their methodology and data sources.</p>
                    <p class="source"><sup id="4">4</sup> Zaru, Deena. “Caitlyn Jenner Takes Trump up on Bathroom Offer.” CNN, 28 Apr. 2016, <a href="www.cnn.com/2016/04/28/politics/caitlyn-jenner-bathroom-trump-tower-donald-trump/index.html">www.cnn.com/2016/04/28/politics/caitlyn-jenner-bathroom-trump-tower-donald-trump.</a></p>
$ART_6$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  hero_image_url = EXCLUDED.hero_image_url,
  hero_image_caption = EXCLUDED.hero_image_caption,
  categories = EXCLUDED.categories,
  read_time = EXCLUDED.read_time,
  review_rating = EXCLUDED.review_rating,
  authors = EXCLUDED.authors,
  legacy_url = EXCLUDED.legacy_url,
  published = EXCLUDED.published,
  unlisted = EXCLUDED.unlisted,
  published_at = EXCLUDED.published_at,
  body_html = EXCLUDED.body_html;

-- 7. kamalacampaign110424.html
INSERT INTO public.articles (
  slug,
  title,
  subtitle,
  hero_image_url,
  hero_image_caption,
  categories,
  read_time,
  review_rating,
  authors,
  post_type,
  legacy_url,
  published,
  unlisted,
  published_at,
  body_html
)
VALUES (
  'kamalacampaign110424',
  'From Momentum to Mediocrity: A Campaign That Lost Its Spark',
  '"It is time for a new generation of leadership, and I am ready to offer that."',
  'assets/images/featured/kamala-speech-1.jpg',
  'Andrew Harnik/Getty Images',
  ARRAY['Politics']::text[],
  '15 min read',
  NULL,
  '[{"name":"Sosa","avatar_url":"assets/images/authors/sosaicon1.png"}]'::jsonb,
  'standard',
  'articles/kamalacampaign110424.html',
  true,
  false,
  '2024-11-04T12:00:00.000Z',
  $ART_7$
<h2 class="sub-heading">The election is drawing near, and it's been 106 days since Kamala Harris became the Democratic Party's presumptive (and then official) presidential nominee. </h2>
        <p class="post-text">
            When Biden first dropped out in late July, momentum was strong for the Harris campaign. Instead of feeling like November would show an inevitable Trump victory, voters nationwide were enthused by the contrast of a young, glass-ceiling-breaking candidate. However, it takes effort to keep momentum going, and Harris’ campaign has lacked that effort.
        </p>
            <div class="toc-box">
                <h2 class="sub-heading" id="toctitle">Table of Contents</h2>
                    <p class="toc">
                        <!-- Preface -->
                        <br><a href="#pref">0. A Much-Needed Preface</a>
                        <!-- Section 1 -->
                        <br><a href="#dncs">1. First Signs of Cracking: The DNC Speech</a><br>
                            <!-- Nested Headings -->
                            <a href="#immigrcrime" class="toc-nested-link">a) Immigration; the Mythical Crime Wave</a><br>
                            <a href="#foreign" class="toc-nested-link">b) Foreign Policy: The Optics Can't Get Worse</a><br>
                            <a href="#pollz" class="toc-nested-link">c) Did This Work? Check The Polls</a><br>
                        <!-- Section 2 -->
                        <a href="#lack">2.	The In-Between: Rallies, Interviews, or Lack Thereof</a><br>
                        <!-- Section 3 -->
                        <a href="#close">3. The Closing Argument</a><br>
                        <!-- Section 4 -->
                        <a href="#pathz">4. Four(-ish) Paths to Victory</a><br>
                            <!-- Nested Headings -->
                            <a href="#282" class="toc-nested-link">a) 282-256, Blue Iowa</a><br>
                            <a href="#276" class="toc-nested-link">b) 276-262, No Iowa</a><br>
                            <a href="#270" class="toc-nested-link">c) 270-268, A Real Nailbiter</a><br>
                            <a href="#325" class="toc-nested-link">d) 325-213, The Margin of Error Kicks In</a><br>
                        <!-- Section 5 -->
                        <a href="#concl">5. A Drained Conclusion</a><br>
                    </p>
            </div>
        <!-- Article Content -->
        <h2 class="sub-heading" id="pref">0. A Much-Needed Preface</h2>
                <p class="post-text">
                    This article is not written to be an endorsement of Republican presidential candidate Donald Trump. If Trump has a fair opinion on something, I’ll “give him credit for it”, but it’s rare to come across a sensible view of his. Additionally, though this piece is meant to change your view of Kamala Harris and her campaign, it is not necessarily meant to change your vote on November 5th. If you’d like to vote for her out of adoration for her policies (interesting opinion), do that. If you’d like to vote for her because you believe she’s the lesser of two evils, do that. If you’d like to vote for Donald Trump, you may be too far gone for me to change your mind, so you can go ahead and continue with that. The same goes for people voting for a third party or completely abstaining: do what you want! What I do hope you take from this is that both major candidates are extremely flawed, and the concept of “facts” has been twisted in this election cycle. We must be critical of both parties and their failures to represent and care for the American people.
                </p>
        <h2 class="sub-heading" id="dncs">1. First Signs of Cracking: The DNC Speech</h2>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/110424-kamala/kamala-dnc-2.jpg" alt="" class="post-image-content">
            </div>
            <p class="image-caption">REUTERS/Kevin Wurm</p>
                <p class="post-text">
                Harris came onto the election cycle scene unprecedentedly late, but as she arrived, she raised a historic amount of money; within 24 hours of Biden’s dropout announcement, the campaign had raised 81 million dollars.<a href="#1" class="textdecor"><sup>1</sup></a> Despite this, she still needed the delegates to get this nomination certified, and that was to happen at the Democratic National Convention in August. However, with this came a speech that started strong and quickly became questionably awful.
                </p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        <i>And with this election, and — and with this election, our nation — our nation, with this election, has a precious, fleeting opportunity to move past the bitterness, cynicism and divisive battles of the past, a chance to chart a new way forward. Not as members of any one party or faction, but as Americans.
                        </i>
                    </p>
                <p class="post-text">
                The speech began with surprisingly good imagery describing Harris’ upbringing, creating good appeal for the working- and middle-class Americans listening in. This transitioned into a brief yet touching story about a friend of hers being sexually abused by her father, which then inspired Kamala to become a prosecutor – “for the people.” You might be thinking, “This sounds pretty nice, and if not that, it’s standard; how could this go wrong?”
                </p>
            <h3 class="nested-heading" id="immigrcrime">a) Immigration; the Mythical Crime Wave</h3>
                <p class="post-text">
                Well, shortly after, she presents the topic of the border. If the Democratic party were sensible, they’d attack Republican rhetoric on this issue using stone-cold facts. For example, a study directly funded by the U.S. Department of Justice<sup><a href="#2">2</a></sup> using crime data from Texas concluded that undocumented immigrants commit substantially less crime than U.S.-born citizens; in fact, U.S. citizens “are over two times more likely [to be] arrested for violent crime.”
                </p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/110424-kamala/violent-crime-offending-rates-documentation.jpg" alt="" class="post-image-content">
                </div>
                <p class="post-text">
                Of course, there are 49 other states in the country, but Texas stands out as not only a Mexico-bordering state but also the only state that records criminal convictions by immigration status.
                </p>
                <p class="post-text">A 2017 study<sup><a href="#3">3</a></sup> from the Journal of Ethnicity in Criminal Justice also deduces that there is no basis for assuming immigration and crime rates have a direct relationship; in fact, there is stronger evidence to show that increased immigration results in less crime, especially property crime.</p>
                <p class="post-text">
                Contrary to this overwhelming evidence, though, Republicans still spew false and harmful rhetoric about immigrants. For example, at the Republican National Convention, Donald Trump said:
                </p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        <i>We also have an illegal immigration crisis, and it’s taking place right now. It’s a massive invasion at our southern border that has spread misery, crime, poverty, disease, and destruction to communities all across our land. Nobody’s ever seen anything like it.
                        </i>
                    </p>
                <p class="post-text">
                Has it truly spread crime? Well, let’s look at even more data.
                </p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/110424-kamala/pew-research-immigrant-share-usa.png" alt="" class="post-image-content">
                    <img src="assets/images/articles/110424-kamala/ncvs-violent-victimization-rate.png" alt="" class="post-image-content">
                    <img src="assets/images/articles/110424-kamala/fbi-arrests-usa-over-time.png" alt="" class="post-image-content">
                </div>
                <p class="post-text">
                Above are three graphs. The first graph was created by the Pew Research Center<sup><a href="#4">4</a></sup> using information from the U.S. Census Bureau and describes the percentage of immigrants in the United States population over time, with small notes indicating the amount at different periods. The two other graphs are from the National Crime Victimization Survey<sup><a href="#5">5</a></sup> and the Federal Bureau of Investigation<sup><a href="#6">6</a></sup>, respectively, and they both represent violent victimizations and arrests in the United States over time. Each graph shares coverage of the period after 2016, and with that, one can see that there is <b>no basis to assume an increase in immigrants leads to an increase in crime.</b>
                </p>
                <p class="post-text">Now, was any of this presented when speaking of the border?</p>
                <p class="post-text"><b>Absolutely not.</b></p>
                <p class="post-text">
                What was presented was dissatisfaction with Trump for “killing” the Border Act of 2024<sup><a href="#7">7</a></sup>, which was introduced into the House to tackle “border security and combatting fentanyl” with billions of taxpayer dollars allocated to this cause. Its proposals include massive increases in funding for detention centers – not increasing their quality but increasing their number of beds. Of course, this is a great idea because our immigration detention centers famously have great, humane conditions, like inadequate medical care<sup><a href="#8">8</a></sup> and the use of solitary confinement rather than proper mental care<sup><a href="#9">9</a></sup>.
                </p>
                <p class="post-text">
                The topic of fentanyl is also an interesting one; in 2022, 89% of fentanyl traffickers were U.S. citizens<sup><a href="#10">10</a></sup>, rather than migrants. Additionally, during 2023, roughly 93% of fentanyl seizures “occurred at legal crossing points or interior vehicle checkpoints, not on illegal migration routes.<sup><a href="#10">10</a></sup>”
                </p>
                <p class="post-text">
                This tough attitude on immigration with little basis in fact won’t stop illegal immigration, though. Even if this Border Act finds a way to pass if Harris is elected president, it will not eliminate the motives people have to flee to the United States. It is a similar situation to Republican views on abortion; making abortion illegal will eliminate legal abortions while increasing illegal abortions, which tend to be more unsafe. The number of illegal and legal abortions combined will not see a significant decrease<sup><a href="#11">11</a></sup>, as one has not tackled the <b>reasons</b> women get abortions. In cases where it is not a required medical procedure to save the life of the mother, this need for an abortion is likely to be caused by a lack of sex education<sup><a href="#12">12</a></sup>, a lack of access to contraceptives<sup><a href="#13">13</a></sup>, or a combination of both. In the case of immigration, restricting it further, increasing punishment for illegal crossings, and refusing to make real reforms to the asylum system only increases the desperation of people wanting to immigrate. As a result, they’re more likely to consult cartels in the area and pay to be transported across the border in trailers or trucks, which often overheat and cause death<sup><a href="#14">14</a></sup> for the migrants being “smuggled.”
                </p>
                <p class="post-text">In conclusion, Harris could care less about the facts on immigration. Instead, she’s operating on the assumption that Republicans are correct on the issue, but they’re just not cruel enough about it. <b>Great! What’s next?</b></p>
            <h3 class="nested-heading" id="foreign">b) Foreign Policy: The Optics Can't Get Worse</h3>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        <i>As commander in chief, I will ensure America always has the strongest, most lethal fighting force in the world.
                        </i>
                    </p>
                <p class="post-text"><b>What is going on?</b></p>
                <p class="post-text">I guess I had the misconception that Democrats were the doves in the two-party system. Even Donald Trump has had moments where he expresses views more dovish than this one, as he did in a 2016 Republican debate against Jeb Bush:<sup><a href="#15">15</a></sup></p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        Obviously, the war in Iraq was a big fat mistake… we spent two trillion dollars, thousands of lives, we don’t even have [control over Iraq]… George Bush made a mistake. We can make mistakes, but that one was a beauty. We should have never been in Iraq. We have destabilized the Middle East. …I want to tell you: [the Bush administration] lied. They said there were weapons of mass destruction. There were none, and they knew there were none.
                    </p>
                <p class="post-text">After that last sentence, Trump was quite audibly booed by the audience. </p>
                <p class="post-text">Of course, Trump is not a legitimate dove when you look at his actions – dropping a record number of bombs on Afghanistan in 2018 and 2019 as Commander-in-Chief<sup><a href="#16">16</a></sup> – but he at least presents himself in such a manner optics-wise. What he said in this 2016 debate is more anti-war than much of anything Harris has pushed in this speech so far (and the rest of her campaign, as we will soon analyze). We see this quite clearly when she shifts the focus to Israel…</p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        President Biden and I are working around the clock… to get a hostage deal and a cease-fire deal done. …I will always stand up for Israel’s right to defend itself because the people of Israel must never again face the horror that a terrorist organization called Hamas caused on Oct. 7…
                    </p>
                <p class="post-text">She says this, while also following with: </p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        At the same time, what has happened in Gaza over the past 10 months is devastating. So many innocent lives lost. Desperate, hungry people fleeing for safety, over and over again. The scale of suffering is heartbreaking.
                    </p>
                <p class="post-text">Who is causing the loss of those innocent lives? Why are these people “desperate, hungry” and “fleeing for safety”? Who is sending billions in military aid to the people who are causing this mass devastation and suffering of the Palestinian people? What great questions with answers that the Democratic party will never find. Despite feeling “heartbroken” by this <b>mysterious</b> suffering, Harris is still in opposition to an arms embargo on Israel.<sup><a href="#17">17</a></sup></p>
            <h3 class="nested-heading" id="pollz">c) Did This Work? Check The Polls</h3>
                <p class="post-text">
                Now, maybe she has good reason for being at best ignorant, and at worst deliberately lying. Maybe that is how you truly captivate the American people and sweep the election. Let’s see how the populace responded after this August 22nd speech by taking a look at FiveThirtyEight’s national poll averages.
                </p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/110424-kamala/fivethirtyeight-1.png" alt="" class="post-image-content">
                </div>
                <p class="post-text">
                That looks pretty good considering how close the election is! Let’s look at the bigger picture.
                </p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/110424-kamala/fivethirtyeight-2.png" alt="" class="post-image-content">
                </div>
                <p class="post-text">
                Oh... oh, okay.
                </p>
                <p class="post-text">
                This 3.7-point lead has not been re-achieved by Harris since. She hasn’t had a three-point lead or higher since September 18th. Now, she sits at a <b>whopping 0.9-point lead</b>. Before August 22nd, her numbers were quite steadily increasing.
                </p>
                <p class="post-text">
                This is not to say she will lose the election, but it is scarily close for the Democrats. Closer than one would prefer in an election that is being dubbed “the most consequential in our lifetime” … except politicians say that every time, it seems.
                </p>
                <p class="post-text">
                Well, maybe she’s changed her rhetoric since then, and the poll numbers are unrelated to this speech. I have hope, so let’s investigate!
                </p>
            <h2 class="sub-heading" id="lack">2. The In-Between: Rallies, Interviews, or Lack Thereof</h2>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/110424-kamala/kamala-walz-entrevista.jpg" alt="" class="post-image-content">
                </div>
                <p class="image-caption">Will Lanzoni/CNN</p>
                <p class="post-text">It didn't get better.</p>
                <p class="post-text">
                Yeah, she’s still “good” (from a Democrat perspective) on abortion – that wasn’t a big focal point of the DNC speech, as that’s a very obvious issue she has the upper hand on. She instead spoke of that issue at her other rallies later.
                </p>
                <p class="post-text">
                Besides that, I can’t praise her much. I understand that opinions change, but it is too easy for Republicans to attack her for flip-flopping. In 2018, she was near Bernie Sanders’ level of progressive: in favor of single-payer Medicare for All, supported the Green New Deal, and anti-fracking. None of those are true for Harris’ 2024 campaign, so what happened? CNN’s Dana Bash asked such directly about fracking during Harris’ first interview <sup><a href="#18">18</a></sup>, and this was Harris’ reply:
                </p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        Well, let’s be clear. My values have not changed. I believe it is very important that we take seriously what we must do to guard against what is a clear crisis in terms of the climate. And to do that, we can do what we have accomplished thus far.
                    </p>
                <p class="post-text">Bash listens on, though, waiting for something of substance after this nothingburger of a response:</p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        The Inflation Reduction Act, what we have done to invest by my calculation over t— probably a trillion dollars over the next ten years investing in a clean energy economy. What we’ve already done creating over 300,000 new clean energy jobs. That tells me from my experience as vice president we can do it without banning fracking. In fact, Dana — Dana, excuse me — I cast the tie-breaking vote that actually increased leases for fracking as vice president. So I’m very clear about where I stand.
                    </p>
                <p class="post-text">
                Bash then asked, "And was there some policy or scientific data that you saw that you said, “Oh, okay. I get it now”?"
                </p>
                <p class="post-text">Harris responds,"What I have seen is that we can — we can grow and we can increase a thriving clean energy economy without banning fracking."</p>
                <p class="post-text">This implies that fracking is “clean energy”… which it is clearly not. In a year, fracking can produce ~450,000 tons worth of air pollution<sup><a href="#19">19</a></sup>; it also produced 280 billion gallons of toxic wastewater in 2012<sup><a href="#19">19</a></sup>.</p>
                <p class="post-text">Has there been much else? Well, not really. She did mention a policy banning price gouging, which sounds quite nice, but that’s it for the Harris 2024 campaign. Is it clear enough that the momentum has vanished?</p>
            <h2 class="sub-heading" id="close">3. The Closing Argument</h2>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/110424-kamala/kamala-ellipse-speech.jpg" alt="" class="post-image-content">
                </div>
                    <p class="image-caption">Kent Nishimura/Getty Images</p>
                <p class="post-text">
                The speech begins with a condemnation of Donald Trump and his inciting/complicity in the January 6th, 2021, storming of the U.S. Capitol building in an attempt to overturn the results of the 2020 election. Arguably, she talks about Trump for a bit too long before getting to her own policy positions.
                </p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        And as President, I will fight to help first-time homebuyers with your down payment, take on the companies that are jacking up rent and build millions of new homes.
                        For years, we have heard excuses about why America can’t build enough housing. Enough with the excuses. I’m going to cut the red tape and work with the private sector and local governments to speed up building and get it done.
                    </p>
                <p class="post-text">
                In reality, America has a surplus of housing<sup><a href="#20">20</a></sup>. The shortage we do have is a shortage of affordable housing<sup><a href="#21">21</a></sup>. How is further deregulation (working with the private sector, which includes “the companies that are jacking up rent”) supposed to aid homebuyers in this situation? How about considering building public housing?<sup><a href="#22">22</a></sup>
                </p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        And look, on another subject, politicians have got to stop treating immigration as an issue to scare up votes in an election. And instead, treat it as the serious challenge that it is that we must finally come together to solve. I will work with Democrats and Republicans to sign into law the border security bill that Donald Trump killed.
                    </p>
                <p class="post-text">
                What is challenging about immigration besides the awful immigration system of the United States? Instead of internal reforms to the asylum process and detention centers, apparently, we just need more “border security.” Why? Because the immigrants are bringing in crime and fentanyl… except we’ve already debunked that nativist lie.
                </p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        And when I am President, we will quickly remove those who arrive here unlawfully, prosecute the cartels, and give Border Patrol the support they so desperately need.
                    </p>
                <p class="post-text">
                Is Harris actually pandering so hard to the right that she’s saying “Mass Deportation Now”, the war cry shouted at every Trump rally to deport all undocumented immigrants? Why should we advocate removing them all (which would hurt the economy if you weren’t worried about the disruptions it would cause to their lives) instead of providing them paths to citizenship?<sup><a href="#23">23</a></sup> How did her rhetoric on immigration get <b>worse</b>?
                </p>
                    <p class="quote-text">
                        <i class='bx bxs-quote-left'></i>
                        I’ve lived the promise of America. And I see the promise of America in all of you. In all of you. I see it…I see it in Republicans who have never voted for a Democrat before, but have put the Constitution of the United States over party.
                    </p>
                <p class="post-text">
                So much pandering to the Republicans for no real reason, which obviously isn’t working if the election is still horribly close.
                Rather than any improvements to the campaign, it has only gotten worse. I can’t say I should’ve expected anything more from the Democrats, since their strategies were similar levels of awful in 2016.
                </p>
            <h2 class="sub-heading" id="pathz">4. Four(-ish) Paths to Victory</h2>
                <p class="post-text">
                Kamala Harris is still likely to win tomorrow, despite my anger with her campaign. Let us look at a few ways she could get to this point.
                </p>
                <h3 class="nested-heading" id="282">a) 282-256, Blue Iowa</h3>
                    <div class="post-image-wrapper">
                        <img src="assets/images/articles/110424-kamala/bluepath-1.png" alt="" class="post-image-content">
                    </div>
                    <p class="post-text">In this possibility, Harris loses Arizona, Georgia, and North Carolina, while winning Michigan, Nevada, Pennsylvania, Wisconsin... and Iowa? If I wrote this a week ago, I’d sound deranged, and rightfully so. But with the recent Selzer poll<sup><a href="#24">24</a></sup> putting Kamala at 3 points ahead of Trump, blue Iowa is a legitimate possibility. If not that, Trump would win Iowa by a scarily close amount of votes, likely down to the small thousands. In terms of Arizona, Georgia, and North Carolina, it’s hard to see Harris win any more than one of these states; <b>MAYBE</b> Georgia and a <i>smaller maybe</i> on North Carolina, but Arizona seems destined to be red. Maybe I’m wrong, though!</p>
                <h3 class="nested-heading" id="276">b) 276-262, No Iowa</h3>
                    <div class="post-image-wrapper">
                        <img src="assets/images/articles/110424-kamala/bluepath-2.png" alt="" class="post-image-content">
                    </div>
                    <p class="post-text">
                        Pretty much the same as above but without the mythical blue Iowa. Next!
                    </p>
                <h3 class="nested-heading" id="270">c) 270-268, A Real Nailbiter</h3>
                    <div class="post-image-wrapper">
                        <img src="assets/images/articles/110424-kamala/bluepath-3.png" alt="" class="post-image-content">
                    </div>
                    <p class="post-text">
                    This is if the Dems get unlucky and lose Nevada. They’ll still win but by a mere two electoral votes. If this truly does happen, I’m very uncertain of the Democrats <b>actually winning</b>; what’s more likely is a 2000-style legal dispute commencing. If that does happen, we all know it won’t end well. I guess it’s not much of a path to victory but more of a path to the election being stolen (I sound like a 2020-Stop-The-Steal-Trumper, but Al Gore legitimately did win more votes<sup><a href="#25">25</a></sup> in the state of Florida, with or without the votes that mistakenly went to Pat Buchanan<sup><a href="#26">26</a></sup>).
                    </p>
                <h3 class="nested-heading" id="325">d) 325-213, The Margin of Error Kicks In</h3>
                    <div class="post-image-wrapper">
                        <img src="assets/images/articles/110424-kamala/bluepath-4.png" alt="" class="post-image-content">
                    </div>
                    <p class="post-text">
                    I don’t really expect this to happen, but 2020 showed me that anything is possible. Not necessarily a landslide, but it is quite a solid victory for the Democrats. This wouldn’t nullify my criticisms; this race should have never gotten this close, especially against such an <i>awful candidate</i>.
                    </p>
                <h2 class="sub-heading" id="concl">5. A Drained Conclusion</h2>
                    <div class="post-image-wrapper">
                        <img src="assets/images/articles/110424-kamala/its-joever.jpg" alt="" class="post-image-content">
                    </div>
                        <p class="image-caption">It's so joever.</p>
                    <p class="post-text">
                    Again, Kamala Harris will still probably be our next president, but I can’t say I’m particularly enthusiastic about it. She has more charisma than Biden, sure, but a sizeable part of her campaign has been built on lies because of the use of right-wing framing on issues. With this, the “inclusive” Democrats seem to be doing nearly the same as the Republicans to fuel anti-immigrant sentiment nationwide. Similarly, there is only emptiness in Harris’ “hopes for peace” in the Gaza Strip and Lebanon. Running on a ticket without Joe Biden gives her a chance to distance herself from his extreme pro-Israel position, but she has failed to take a step toward that, despite it hurting her poll numbers (especially in the swing state of Michigan). With American Muslim voters, <b>Jill Stein</b> and Harris are neck-and-neck, as the former has 42.3% and the latter has 41% of their support<sup><a href="#27">27</a></sup>. Isn’t it puzzling as to why someone would not be comfortable voting for a candidate who refuses to interfere in the mass killing and devastation of their family – whether it be family by blood or faith? <b>Alas, I hate to feel disappointed, because I should have seen this all coming</b>.
                </p>
                <p class="post-text"><b>Readers, have a great week! Stay warm and stay safe.</b></p>
                <h2 class="sub-heading">Further Reading</h2>
                    <p class="source"><sup id="1">1</sup> Samuels, Brett. “Harris Breaks 24-Hour Fundraising Record after Biden Drops Out.” The Hill, July 22, 2024. <a href="https://thehill.com/homenews/campaign/4786610-harris-breaks-fundraising-record/">thehill.com/homenews/campaign/4786610-harris-breaks-fundraising-record/.</a></p>
                    <p class="source"><sup id="2">2</sup> Light, Michael T. “Unauthorized Immigration, Crime, and Recidivism: Evidence from Texas.” National Institute of Justice. U.S. Department of Justice, January 2024. <a href="https://www.ojp.gov/pdffiles1/nij/grants/308552.pdf">ojp.gov/pdffiles1/nij/grants/308552.pdf.</a></p>
                    <p class="source"><sup id="3">3</sup> Adelman, Robert, Lesley Williams Reid, Gail Markle, Saskia Weiss, and Charles Jaret. “Urban Crime Rates and the Changing Face of Immigration: Evidence across Four Decades.” Journal of Ethnicity in Criminal Justice 15, no. 1 (November 21, 2016): 52–77. <a href="https://doi.org/10.1080/15377938.2016.1261057">doi.org/10.1080/15377938.2016.1261057.</a></p>
                    <p class="source"><sup id="4">4</sup> Moslimani, Mohamad, and Jeffrey S. Passel. “What the Data Says about Immigrants in the U.S.” Pew Research Center. Pew Research Center, September 27, 2024. <a href="https://www.pewresearch.org/short-reads/2024/09/27/key-findings-about-us-immigrants/">pewresearch.org/short-reads/2024/09/27/key-findings-about-us-immigrants/.</a></p>
                    <p class="source"><sup id="5">5</sup> National Crime Victimization Survey. “NCVS Dashboard.” ncvs.bjs.ojp.gov, n.d. <a href="https://ncvs.bjs.ojp.gov/multi-year-trends/crimeType">ncvs.bjs.ojp.gov/multi-year-trends/crimeType</a>.
                    </p>
                    <p class="source"><sup id="6">6</sup> Federal Bureau of Investigation. “Crime Data Explorer.” Cjis.gov, 2023. <a href="https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/explorer/crime/arrest">cde.ucr.cjis.gov/LATEST/webapp/#/pages/explorer/crime/arrest.</a>
                    </p>
                    <p class="source"><sup id="7">7</sup> Murphy, Christopher. Border Act of 2024, Pub. L. No. S.4361, Congress.gov (2024). <a href="https://www.congress.gov/bill/118th-congress/senate-bill/4361/text">congress.gov/bill/118th-congress/senate-bill/4361/text.</a>
                    </p>
                    <p class="source"><sup id="8">8</sup> Cho, Eunice Hyunhye, and Tessa Wilson. “Deadly Failures: Preventable Deaths in U.S. Immigrant Detention.” American Civil Liberties Union, June 21, 2024. <a href="https://www.aclu.org/publications/deadly-failures-preventable-deaths-in-us-immigrant-detention">aclu.org/publications/deadly-failures-preventable-deaths-in-us-immigrant-detention.</a>
                    </p>
                    <p class="source"><sup id="9">9</sup> Wilson, Tessa. “‘Endless Nightmare’: Torture and Inhuman Treatment in Solitary Confinement in U.S. Immigration Detention.” PHR, February 6, 2024. <a href="https://phr.org/our-work/resources/endless-nightmare-solitary-confinement-in-us-immigration-detention/">phr.org/our-work/resources/endless-nightmare-solitary-confinement-in-us-immigration-detention/.</a>
                    </p>
                    <p class="source"><sup id="10">10</sup> Bier, David. “U.S. Citizens Were 89% of Convicted Fentanyl Traffickers in 2022.” Cato.org, 2023. <a href="https://www.cato.org/blog/us-citizens-were-89-convicted-fentanyl-traffickers-2022">cato.org/blog/us-citizens-were-89-convicted-fentanyl-traffickers-2022.</a>
                    </p>
                    <p class="source"><sup id="11">11</sup> Bearak, Jonathan, Anna Popinchalk, Bela Ganatra, Ann-Beth Moller, Özge Tunçalp, Cynthia Beavin, Lorraine Kwok, and Leontine Alkema. “Unintended Pregnancy and Abortion by Income, Region, and the Legal Status of Abortion: Estimates from a Comprehensive Model for 1990–2019.” The Lancet Global Health 8, no. 9 (July 22, 2020): e1152–61. <a href="https://doi.org/10.1016/S2214-109X(20)30315-6">doi.org/10.1016/S2214-109X(20)30315-6.</a>
                    </p>
                    <p class="source"><sup id="12">12</sup> Cheedalla, Aneesha, Caroline Moreau, and Anne E. Burke. “Sex Education and Contraceptive Use of Adolescent and Young Adult Females in the United States: An Analysis of the National Survey of Family Growth 2011–2017.” Contraception: X 2 (2020): 100048. <a href="https://doi.org/10.1016/j.conx.2020.100048">doi.org/10.1016/j.conx.2020.100048.</a>
                    </p>
                    <p class="source"><sup id="13">13</sup> Williams, Diane Duke. “Access to Free Birth Control Reduces Abortion Rates.” WashU Medicine, October 12, 2012. <a href="https://medicine.washu.edu/news/access-to-free-birth-control-reduces-abortion-rates/">medicine.washu.edu/news/access-to-free-birth-control-reduces-abortion-rates/.</a>
                    </p>
                    <p class="source"><sup id="14">14</sup> Hernández, Arelis R, Nick Miroff, and Maria Sacchetti. “46 Migrants Found Dead in Texas inside Sweltering Tractor-Trailer.” Washington Post. The Washington Post, June 28, 2022. <a href="https://www.washingtonpost.com/nation/2022/06/27/migrants-dead-texas/">washingtonpost.com/nation/2022/06/27/migrants-dead-texas/.</a>
                    </p>
                    <p class="source"><sup id="15">15</sup> CBS News. “Donald Trump Attacks George W. Bush on 9/11, Iraq.” YouTube Video. YouTube, February 13, 2016. <a href="https://www.youtube.com/watch?v=H4ThZcq1oJQ">youtube.com/watch?v=H4ThZcq1oJQ.</a>
                    </p>
                    <p class="source"><sup id="16">16</sup> United States Air Forces Central Command. “Afghanistan Combined Forces Air Component Commander 2013-2019 Airpower Statistics.” U.S. Air Forces Central, December 31, 2019. <a href="https://www.afcent.af.mil/Portals/82/Documents/Airpower%20summary/(U)%20APPROVED%20Dec%202019%20APS%20Data.pdf?ver=2020-01-27-023439-697">afcent.af.mil/Portals/82/Documents/Airpower%20summary/(U)%20APPROVED%20Dec%202019%20APS%20Data.pdf?ver=2020-01-27-023439-697.</a>
                    </p>
                    <p class="source"><sup id="17">17</sup> Marans, Daniel. “Harris Says She Will Not Add Conditions to U.S. Weapons for Israel.” HuffPost, August 30, 2024. <a href="https://www.huffpost.com/entry/kamala-harris-gaza-war-biden-arms-policy_n_66d12f4ee4b0099ccb749660.">https://www.huffpost.com/entry/kamala-harris-gaza-war-biden-arms-policy.</a>
                    </p>
                    <p class="source"><sup id="18">18</sup> CNN. “READ: Harris and Walz’s Exclusive Joint Interview with CNN.” CNN. CNN, August 30, 2024. <a href="https://www.cnn.com/2024/08/29/politics/harris-walz-interview-read-transcript/index.html">cnn.com/2024/08/29/politics/harris-walz-interview-read-transcript/index.html.</a>
                    </p>
                    <p class="source"><sup id="19">19</sup> Ridlington, Elizabeth, and John Rumpler. “Fracking by the Numbers Key Impacts of Dirty Drilling at the State and National Level,” October 2013. <a href="https://environmentamerica.org/wp-content/uploads/2022/08/EA_FrackingNumbers_scrn-6.pdf">environmentamerica.org/wp-content/uploads/2022/08/EA_FrackingNumbers_scrn-6.pdf.</a>
                    </p>
                    <p class="source"><sup id="20">20</sup> McClure, Kirk, and Alex Schwartz. “Where Is the Housing Shortage?” Housing Policy Debate, April 18, 2024, 1–15. <a href="https://doi.org/10.1080/10511482.2024.2334011">doi.org/10.1080/10511482.2024.2334011.</a>
                    </p>
                    <p class="source"><sup id="21">21</sup> National Low Income Housing Coalition. “The GAP.” National Low Income Housing Coalition, 2024. <a href="https://nlihc.org/gap">nlihc.org/gap.</a>
                    </p>
                    <p class="source"><sup id="22">22</sup> Denvir, Daniel, and Yonah Freemark. “Just Build the Homes.” Slate, May 22, 2023. <a href="https://slate.com/business/2023/05/public-housing-upzoning-yimby-affordability-crisis.html">slate.com/business/2023/05/public-housing-upzoning-yimby-affordability-crisis.html.</a>
                    </p>
                    <p class="source"><sup id="23">23</sup> Peri, Giovanni, and Reem Zaiour. “Citizenship for Undocumented Immigrants Would Boost U.S. Economic Growth.” Center for American Progress. Center for American Progress, June 14, 2021. <a href="https://www.americanprogress.org/article/citizenship-undocumented-immigrants-boost-u-s-economic-growth/">americanprogress.org/article/citizenship-undocumented-immigrants-boost-u-s-economic-growth/.</a>
                    </p>
                    <p class="source"><sup id="24">24</sup> Pfannenstiel, Brianne. “Iowa Poll: Kamala Harris Leapfrogs Donald Trump to Take Lead near Election Day. Here’s How.” The Des Moines Register. Des Moines Register, November 2, 2024. <a href="https://www.desmoinesregister.com/story/news/politics/iowa-poll/2024/11/02/iowa-poll-kamala-harris-leads-donald-trump-2024-presidential-race/75354033007/.">desmoinesregister.com/story/news/politics/iowa-poll/2024/11/02/iowa-poll-kamala-harris-leads-donald-trump-2024-presidential-race/75354033007/.</a>
                    </p>
                    <p class="source"><sup id="25">25</sup> Kettle, Martin. “Florida ‘Recounts’ Make Gore Winner.” The Guardian, January 29, 2001, sec. World news. <a href="https://www.theguardian.com/world/2001/jan/29/uselections2000.usa">theguardian.com/world/2001/jan/29/uselections2000.usa.</a>
                    </p>
                    <p class="source"><sup id="26">26</sup> Ward, Jonathan N., Ken Shotts, Jasjeet S. Sekhon, Walter R. Mebane, Jr., Michael C. Herron, and Henry E. Brady. “The Butterfly Did It: The Aberrant Vote for Buchanan in Palm Beach County, Florida.” Stanford Graduate School of Business, n.d. <a href="https://www.gsb.stanford.edu/faculty-research/publications/butterfly-did-it-aberrant-vote-buchanan-palm-beach-county-florida">gsb.stanford.edu/faculty-research/publications/butterfly-did-it-aberrant-vote-buchanan-palm-beach-county-florida.</a>
                    </p>
                    <p class="source"><sup id="27">27</sup> Hooper, Ibrahim. “BREAKING: CAIR’s Final Election Poll Shows Stein and Harris Still Tied among Muslim Voters, Trump Trailing.” Cair.com, November 2024. <a href="https://www.cair.com/press_releases/breaking-cairs-final-election-poll-shows-stein-and-harris-still-tied-among-muslim-voters-trump-trailing/">cair.com/press_releases/breaking-cairs-final-election-poll-shows-stein-and-harris-still-tied-among-muslim-voters-trump-trailing/.</a>
                    </p>
$ART_7$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  hero_image_url = EXCLUDED.hero_image_url,
  hero_image_caption = EXCLUDED.hero_image_caption,
  categories = EXCLUDED.categories,
  read_time = EXCLUDED.read_time,
  review_rating = EXCLUDED.review_rating,
  authors = EXCLUDED.authors,
  legacy_url = EXCLUDED.legacy_url,
  published = EXCLUDED.published,
  unlisted = EXCLUDED.unlisted,
  published_at = EXCLUDED.published_at,
  body_html = EXCLUDED.body_html;

-- 8. prefacemao12032025.html
INSERT INTO public.articles (
  slug,
  title,
  subtitle,
  hero_image_url,
  hero_image_caption,
  categories,
  read_time,
  review_rating,
  authors,
  post_type,
  legacy_url,
  published,
  unlisted,
  published_at,
  body_html
)
VALUES (
  'prefacemao12032025',
  'Preface: Becoming Mao',
  'Coming soon: a SosaSpeaks historical series looking into the myths and memories of the [in]famous Mao Zedong.',
  'assets/images/featured/preface-1.png',
  NULL,
  ARRAY['History', 'Politics']::text[],
  '2 min read',
  NULL,
  '[{"name":"Sosa","avatar_url":"assets/images/authors/sosaicon1.png"}]'::jsonb,
  'standard',
  'articles/prefacemao12032025.html',
  true,
  false,
  '2025-12-03T12:00:00.000Z',
  $ART_8$
<p class="post-text">
           In 1936, American journalist Edgar Snow spent four months interviewing members of the Communist Party of China, including the notable Mao Zedong. His reportings, later synthesized into the book Red Star Over China, revealed a pattern in the way Mao retold historical events:  despite his leadership role in many post-1927 Chinese affairs, he rarely spoke of himself as an individual actor. Snow eventually realized that many Party members “would be able to tell everything that had happened in [their] early youth, but once [they] had become identified with the Red Army <b>[they] lost [themselves] somewhere</b>.”<a href="#1" class="textdecor"><sup>1</sup></a> Their histories became <b>collective</b>, unintentionally straying from individualist framings of their endeavors. After directly inquiring about his personal life, Mao offered to give direct accounts of his early life, but still “seemed mildly surprised that people should spend their time speculating about him.” <a href="#2" class="textdecor"><sup>2</sup></a>
        </p>
        <p class="post-text">
            This sort of conflict between individual and collective is what shapes how one must approach Mao’s life. To begin, few figures are as debated, misunderstood, and mythologized as Mao Zedong. The American State Department and education system work in tandem to produce a black-and-white story of the man: <b>an absolute monster with no regard for humanity nor the wellbeing of his people</b>. There are even published books written by “scholars” that take that pseudohistorical view – just read the absolute hogwash that is Mao: The Unknown Story. This view on Mao is not only a gross oversimplification, but a shameful mechanism of explaining away Mao’s true victories as well as his deep imperfections as a boy, a man, a student, and a leader.
        </p>
        <p class="post-text">
            Additionally, it is important to note that viewing history through the framework of individuals and not collectives can lead to drawing fallacious conclusions. As someone interested in political history, I try my hardest to avoid using the Great Man theory, which isolates the individual from the social, material conditions around them. Yet, leaders do not emerge in a vacuum. Of course, roles of leadership are critical ones as they direct the people under their guidance, but one must remember that a leader’s goals are only realized if their people make the choice to follow their word. Faith in a leader builds through the words and actions of the leader, and this influence is also something important to study. That is why I would like to explore the life of Mao Zedong, critically examining his life along with the cultural, sociopolitical environment around him – how that influenced him, and how he influenced others.
        </p>
        <p class="post-text">
            Across three parts – <b>The Making of Mao (1893–1949),  Mao’s China (1949–1976), and The World Mao Left Behind (1976–Present)</b> – this series traces Mao’s journey from Shaoshan to Beijing, from rural organizer to national leader, from historical figure to global symbol. Each part will consist of a few articles to dig deep into the details that blossomed into impact.
        </p>
        <p class="post-text">
            If we want to understand the world Mao helped build, we need to start at the beginning. Part I begins in Shaoshan, where a boy named Mao Zedong first learned the art of rebellion.
        </p>
                <h2 class="sub-heading" style="font-style: italic;margin-top: 3.5rem;">Further Reading</h2>
                    <p class="source"><sup id="1">1</sup> Snow, Edgar. Red Star over China - 1st Revised and Enlarged Ed. New York: Grove Press, Inc., 1968, 129.</p>
                    <p class="source"><sup id="2">2</sup> Ibid., 130</p>
$ART_8$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  hero_image_url = EXCLUDED.hero_image_url,
  hero_image_caption = EXCLUDED.hero_image_caption,
  categories = EXCLUDED.categories,
  read_time = EXCLUDED.read_time,
  review_rating = EXCLUDED.review_rating,
  authors = EXCLUDED.authors,
  legacy_url = EXCLUDED.legacy_url,
  published = EXCLUDED.published,
  unlisted = EXCLUDED.unlisted,
  published_at = EXCLUDED.published_at,
  body_html = EXCLUDED.body_html;

-- 9. prisonindustrialcomplex030824.html
INSERT INTO public.articles (
  slug,
  title,
  subtitle,
  hero_image_url,
  hero_image_caption,
  categories,
  read_time,
  review_rating,
  authors,
  post_type,
  legacy_url,
  published,
  unlisted,
  published_at,
  body_html
)
VALUES (
  'prisonindustrialcomplex030824',
  'The Absurdity of The Prison Industrial Complex',
  '"Workers of the world, unite! You have nothing to lose but your chains!"',
  'assets/images/featured/prison1.jpg',
  'Source: Tayeb MEZAHDIA via Pixabay',
  ARRAY['Politics', 'Ethics']::text[],
  '6 min read',
  NULL,
  '[{"name":"Sosa","avatar_url":"assets/images/authors/sosaicon1.png"}]'::jsonb,
  'standard',
  'articles/prisonindustrialcomplex030824.html',
  true,
  false,
  '2024-03-08T12:00:00.000Z',
  $ART_9$
<h2 class="sub-heading">1.7 million people are incarcerated in the American prison system, which supports the overarching prison industrial complex – 1.7 million lives and 1.7 million stories.</h2>
            <p class="post-text">For reference, the prison industrial complex is a system based on the overlapping interests of institutions of incarceration, the government, and private corporations. Of the ~171,600 of those in federal prisons, each of them earns a whopping $0.12 to $1.15 per hour of prison labor, and the pay can be even more abysmal in state prisons and county jails.</p>
            <p class="post-text">However, this shouldn’t be a surprise; the 13th Amendment spells this out clearly for everyone to see, as it says,</p>
                <p class="quote-text">
                <i class='bx bxs-quote-left'></i>Neither slavery nor involuntary servitude, except as a punishment for crime whereof the party shall have been duly convicted, shall exist within the United States, or any place subject to their jurisdiction.
            </p>
            <p class="post-text">These inmates may even be forced to create combat helmets for the Department of Defense through the Federal Prison Industries (FPI), which exclusively creates products for the federal government. What helps finish this cycle of labor is the outrageously high recidivism rate – the rate of prisoners relapsing back into criminal behavior and becoming incarcerated – as a study by the Bureau of Justice Statistics showed that, in a study among 24 states in 2008, 82% of prisoners were rearrested at least once during the 10 years that followed their release. The American prison system is insanely flawed, and to rehabilitate criminals and prevent increasing recidivism, we must address the poor conditions and the extreme prevalence of corruption in our prisons. </p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/030824-prison/unicor1.jpg" alt="" class="post-image-content">
                </div>
                <p class="image-caption">Source: Federal Bureau of Prisons</p>
        <h2 class="sub-heading">Because of the economic system the United States is under and has been built on, many decisions made by the government are made purely from monetary motives.</h2>
            <p class="post-text">This is clear when looking at the FPI, – which also goes by UNICOR as its trade name – which is a government organization focused on putting inmates to work. UNICOR itself claims that its systems of labor “helps offenders learn the skills necessary to transition from prison to law-abiding, contributing members of society”. While it is true that inmates learning things such as marketable skills will ease the transition back into society after their release, UNICOR oversees its “learn[ing]” of skills in the wrong ways. To add, UNICOR, for the most part, only gives its products to the federal government, but on their website, UNICOR states that they can work with private sector companies to “utilize our labor force to manufacture their own products, [sic] or purchase directly from UNICOR”. Of course, “utiliz[ing] their labor force” is not as humane as it may seem; UNICOR is notorious for putting their own “labor force” through questionable conditions. Their largest sector is recycling, and throughout the years, they have continuously been caught exposing prisoners and staff to toxins (such as lead) via recycling electronics; none of the prisoners were supplied with protective equipment. Of course, lead has been regulated by the federal government through the Environmental Protection Agency, but that does not apply to prisoners, as one prisoner accounted:</p>
            <p class="quote-text">
                <i class='bx bxs-quote-left'></i>What I… think is the funniest thing about this recycling plant is that the STATE made it illegal to dispose of computers…in their waste…, because it is hazardous to [one’s] health… Guess who our biggest provider of old and recyclable computers and monitors is?? Yup, you guessed it: the good ol’ [sic] STATE!!!
                They are too dangerous for their law-abiding citizens, who need to be protected, but they aren’t too hazardous to federal prison inmates incarcerated in STATE …and who are not being given adequate safety gear to protect them from the hazardous wastes that the citizens are being protected from. Ironic, isn’t it??!!
            </p>
            <p class="post-text">UNICOR also has prisoners manufacture items for the military, such as combat helmets and uniforms, for the same horrible wages. The federal government then uses these products to strengthen the military, which continues to commit global atrocities. However, this absolute mess of cruelty is not only rooted in federal, public prison labor, as there is a more nefarious and greedy character in this situation: private prisons.</p>
            <div class="post-image-wrapper">
                <img src="assets/images/articles/030824-prison/privateprisonprotest.jpeg" alt="" class="post-image-content">
            </div>
            <p class="image-caption">Protestors outside the Otay Mesa Detention Center, owned and operated by private prison company CoreCivic (Getty/Robyn Beck)</p>
        <h2 class="sub-heading">Immigration is a popular issue, especially in reference to the southern United States border, as people are afraid, and they want to find a common enemy to blame.</h2>
            <p class="post-text">In this case, the common enemy is the supposed extreme influx of Mexican immigrants attempting to (or successfully doing so) cross the border, supposedly bringing crime. However, the issue of whether immigration is a problem or not is irrelevant; the main case is the role private prisons play in immigrant detention, which is genuinely disgusting. In the year 2016 alone, <b>~353,000 immigrants passed through a detention center</b>, and three-quarters of the immigrant detainee population were being held in facilities operated and owned by private prison companies. This may not sound too dire until it is found that the largest private prison contractors – CoreCivic, Inc. and GEOGroup, Inc. – <b>earned a rough total of $4 billion in the year following</b> (2017). Prisons owned by corporations like those often defend themselves by saying that they are cutting costs while offering prison services at the same or better quality of government facilities, but evidence shows that these cost-cuts are negated by the fact that private prisons give much longer sentences and have no real difference to federal prisons in terms of recidivism. However, this is far from the worst of it all; private prisons rely on non-violent offenders to be sent to their prisons, as they reduce security costs, yet they keep those non-violent offenders in by lobbying for mandatory minimum sentencing laws, increasing their stays. The sentence length of a prisoner in a public prison is nearly half the sentence of one in a private prison, and it would be irrational to not acknowledge this as a problem.</p>
            <h2 class="sub-heading">How does one expect a prisoner to acknowledge their mistakes and grow from them while the system that is supposed to assist them in doing so is committing far more heinous crimes against its own citizens? </h2>
            <p class="post-text">Regardless of a person’s status as a felon or criminal, they are still people who deserve to be treated with decency and care; crimes are usually done out of desperation, and without addressing the issues outside and inside the system, nothing will be done. Formerly incarcerated people are much more likely to be homeless, which may make them desire to go back to the inhumane yet straightforward way of prison life, compared to the uncertainties of freedom that prison does not prepare them for. Corporations such as UNICOR, regardless of being affiliated with the government or not, lie to us to pretend that prisoners are doing fine, when, in reality, they are being used for nefarious purposes. How must it feel to find out that a random prisoner, only by doing their job, may have been indirectly facilitating the uselessly long War in Afghanistan (legitimately lasting longer than the Vietnam War)? Overall, though, acknowledgment of the problem is not enough; we must act.</p>
        <h2 class="sub-heading">Science is something that is heavily funded in America, even by our federal government, and science clearly shows that programs administering aid such as cognitive-behavioral therapy can help in “deterring crime, assisting victims, and preventing recidivism”. </h2>
            <p class="post-text">Not only that, but fostering a positive environment that allows prisoners to ease back into society will keep citizens out of the prison system and off the streets – providing easy ways for inmates to find employment and education after release would ease that process, as past inmates are already at a significant disadvantage in the job market.  Rehabilitation paired with a complete overhaul of how we view sentencing – the possible elimination of mandatory minimums – would not only improve the lives of inmates but also improve public safety and increase the happiness index of the United States (which barely cracks the top fifteen internationally, regardless of our immense gross domestic product). It may take time, but the results will prove the effort to be meaningful.</p>
        <h2 class="sub-heading">Overall, we are facing a horrible amount of injustices in the current prison system, which is run by corporations and the federal government to increase profit margins and continue global conflicts instead of focusing on bettering the prisoner and society.</h2>
        <p class="post-text"> Currently, prisoners and past inmates are viewed as subhuman, but it does not make much sense to view them this way; regardless of (alleged) criminal history, they are still people with needs, wants, and humanity. When we destroy the connections between people, corruption, objectification, and profit, we will, in turn, build the bridges between people, empathy, and safety. What is the meaning of the criminal justice system if its concept of justice is skewed by arbitrary, internal factors and biases?</p>
        <h2 class="sub-heading">Further Reading</h2>
            <p class="source">Bureau of Justice Statistics. Recidivism of Prisoners Released in 24 States in 2008: A 10-Year Follow-up Period (2008-2018). Sept. 2021,<a href="https://bjs.ojp.gov/sites/g/files/xyckuh236/files/media/document/rpr24s0810yfup0818_sum.pdf">bjs.ojp.gov/sites/g/files/xyckuh236/files/media/document/rpr24s0810yfup0818_sum.pdf.</a></p>
            <p class="source">Carson, E. Ann. “Prisoners in 2016.” Bureau of Justice Statistics, edited by Bureau of Justice Statistics, U.S. Department of Justice, Jan. 2018,<a href="https://bjs.ojp.gov/content/pub/pdf/p16.pdf">bjs.ojp.gov/content/pub/pdf/p16.pdf.</a> </p>
            <p class="source">Couloute, Lucius. “Nowhere to Go: Homelessness among Formerly Incarcerated People.” Prison Policy Initiative, Aug. 2018, <a href="https://www.prisonpolicy.org/reports/housing.html">www.prisonpolicy.org/reports/housing.html.</a></p>
            <p class="source">Drexler, Ken. “Research Guides: 13th Amendment to the U.S. Constitution: Primary Documents in American History: Introduction.” Loc.gov, 1 Aug. 2018, <a href="https://guides.loc.gov/13th-amendment">guides.loc.gov/13th-amendment.</a></p>
            <p class="source">Duwe, Grant, and Valerie Clark. “The Effects of Private Prison Confinement on Offender Recidivism.” Criminal Justice Review, vol. 38, no. 3, Feb. 2013, pp. 375–94, <a href="https://doi.org/10.1177/0734016813478823">https://doi.org/10.1177/0734016813478823.</a> Accessed 28 May 2019.</p>
            <p class="source">Feucht, Thomas, and Tammy Holt. “Does Cognitive Behavioral Therapy Work in Criminal Justice? A New Analysis from CrimeSolutions.” National Institute of Justice, 25 May 2016, <a href="https://nij.ojp.gov/topics/articles/does-cognitive-behavioral-therapy-work-criminal-justice-new-analysis-crimesolutions">nij.ojp.gov/topics/articles/does-cognitive-behavioral-therapy-work-criminal-justice-new-analysis-crimesolutions.</a></p>
            <p class="source">Initiative, Prison Policy. “Prison Wages: Appendix.” Www.prisonpolicy.org, 10 Apr. 2017, <a href="https://www.prisonpolicy.org/reports/wage_policies.html">www.prisonpolicy.org/reports/wage_policies.html.</a></p>
            <p class="source">Jackson, Anita Sarah, et al. TOXIC SWEATSHOPS. Edited by Happy /L.A. Hyder et al., Oct. 2006, <a href="https://static.prisonpolicy.org/scans/ToxicSweatshops.pdf">static.prisonpolicy.org/scans/ToxicSweatshops.pdf.</a> Accessed 4 Oct. 2023.</p>
            <p class="source">Luan, Livia. “Profiting from Enforcement: The Role of Private Prisons in U.S. Immigration Detention.” Migrationpolicy.org, 16 May 2018, <a href="https://www.migrationpolicy.org/article/profiting-enforcement-role-private-prisons-us-immigration-detention">www.migrationpolicy.org/article/profiting-enforcement-role-private-prisons-us-immigration-detention.</a></p>
            <p class="source">Office of the Inspector General. Findings of Fraud and Other Irregularities Related to the Manufacture and Sale of Combat Helmets by the Federal Prison Industries and ArmorSource, LLC, to the Department of Defense. Edited by U.S. Department of Justice, Aug. 2016.</p>
            <p class="source">Prison Legal News. “Prisoners Exposed to Toxic Dust at UNICOR Recycling Factories | Prison Legal News.” Www.prisonlegalnews.org, 15 Jan. 2009, <a href="https://www.prisonlegalnews.org/news/2009/jan/15/prisoners-exposed-to-toxic-dust-at-unicor-recycling-factories/">www.prisonlegalnews.org/news/2009/jan/15/prisoners-exposed-to-toxic-dust-at-unicor-recycling-factories/.</a></p>
            <p class="source">The Bureau of Investigative Journalism. “Drone Warfare — the Bureau of Investigative Journalism.” The Bureau of Investigative Journalism, 2021, <a href="https://www.thebureauinvestigates.com/projects/drone-war">www.thebureauinvestigates.com/projects/drone-war.</a></p>
            <p class="source">UNICOR. “UNICOR Home Page.” Unicor.gov, 2023, <a href="https://www.unicor.gov/#">www.unicor.gov/#. Accessed 4 Oct. 2023.</a></p>
            <p class="source">World Prison Brief. “United States of America | World Prison Brief.” Prisonstudies.org, 2019, <a href="https://www.prisonstudies.org/country/united-states-america">www.prisonstudies.org/country/united-states-america.</a>
            </p>
$ART_9$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  hero_image_url = EXCLUDED.hero_image_url,
  hero_image_caption = EXCLUDED.hero_image_caption,
  categories = EXCLUDED.categories,
  read_time = EXCLUDED.read_time,
  review_rating = EXCLUDED.review_rating,
  authors = EXCLUDED.authors,
  legacy_url = EXCLUDED.legacy_url,
  published = EXCLUDED.published,
  unlisted = EXCLUDED.unlisted,
  published_at = EXCLUDED.published_at,
  body_html = EXCLUDED.body_html;

-- 10. researchsovietwomen042824.html
INSERT INTO public.articles (
  slug,
  title,
  subtitle,
  hero_image_url,
  hero_image_caption,
  categories,
  read_time,
  review_rating,
  authors,
  post_type,
  legacy_url,
  published,
  unlisted,
  published_at,
  body_html
)
VALUES (
  'researchsovietwomen042824',
  'Research Notes: Women of Soviet Russia',
  'Synthesizing research on the status of women in the Soviet Union. Features research from Mary Buckley and the Russian Review.',
  'assets/images/featured/sovietwomen-iww.jpg',
  NULL,
  ARRAY['History', 'Politics']::text[],
  '11 min read',
  NULL,
  '[{"name":"Sosa","avatar_url":"assets/images/authors/sosaicon1.png"}]'::jsonb,
  'standard',
  'articles/researchsovietwomen042824.html',
  true,
  false,
  '2024-04-28T12:00:00.000Z',
  $ART_10$
<h2 class="sub-heading">Buckley, Mary. “Women in the Soviet Union.” <i>Feminist Review</i>, vol. 8, no. 8, 1981, p. 79, https://doi.org/10.2307/1394929.</h2>
            <p class="post-text">This paper provides a comprehensive overview of the history of women’s participation in the Soviet labor force, referencing the theory of Karl Marx and Vladimir Lenin while also citing past instances of female labor participation through penal labor under Peter the Great (circa 1719). Mary Buckley also covers the upholding of gender biases in this realm of female labor; in the late 1800s (during and right after the Industrial Revolution), Buckley states that female labor became “increasingly attractive” primarily due to its low costs, as “The norm was to pay women half, or slightly more than half, of the wage paid to men for identical work.” Figure 1 in this paper also provides a great insight into the participation of both females and males in the Soviet workforce; in 1945 (the last year of the Second World War), female labor participation exceeded male participation by ~12%.</p>
                <div class="post-image-wrapper">
                    <img src="assets/images/articles/042824-sovietwomen/figure1marybuckley.png" alt="" class="post-image-content">
                </div>
            <p class="post-text">Though this all seems to indicate that females enjoyed significantly increased working standards compared to other women in the world (from what I know), Buckley then introduces the issue of women in agriculture and industry and its continuing gender disparities. This involves similar abysmal pay, unskilled work, and abundant occupational segregation. This segregation is mainly present in rural areas, as Buckley states that in 1972, “Two-thirds of the women on state farms [were] field workers, of whom only 1.9% [were] engaged in mechanical labor.” This overviews the Soviet male/female achievement gap, especially in education and healthcare. Buckley states, “At a time when women made up 77% of the medical profession, they were 52% of head doctors…” along with saying that “While 71% of all teachers are women, 69% of secondary school directors are men, although 61% of their deputies are women” (these numbers come from 1980). This is because of the lower productivity and higher absenteeism of women, which is itself caused by traditional attitudes towards the role of women (women staying at home with their children when ill, pregnant, and on maternal leave). </p>
            <p class="post-text">Buckley then creates another section relating everything to women and household labor, first referencing political theory. Based on the works of August Bebel, Friedrich Engels, and Alexandra Kollontai, Buckley states that “Domestic enslavement or 'household bondage' was understood as one aspect of women's oppression deriving from capital.” This was because, according to Bebel, the oppression of women under capital and their material conditions worked in tandem with the oppression of women by dependence on men socially. Lenin went on to state that “petty housework crushes, strangles, stultifies and degrades [women], chains [women] to the kitchen and the nursery, and wastes [women’s] [labor].” However, Buckley presents evidence to prove that, unfortunately, Soviet society has not followed or embodied such principles perfectly (beyond labor conditions). Soviet facilities for childcare were relatively poor, with egregiously long waiting lists associated with construction lags and, as a result, an even higher demand for childcare. These facilities were also quite overcrowded and lacked sufficient supervision due to this demand, ultimately making women not want to go through such trouble and instead return to traditional standards of childcare, which would increase their work absenteeism, lower their pay (or stifle labor achievement), and continue the cycle. </p>
            <p class="post-text">Even though Engels and Lenin believed that “a change in attitudes toward women was essential, and that this would inevitably, almost derivatively, come about once capitalism had been overthrown,” these attitudes were still alive and well in Soviet society. These traditional views were not only echoed by men but also by women themselves. Buckley references two primary sources for this claim. First is a letter to a magazine concerning the matter of ‘bad wives,’ which states, "Girls must be brought up to be aware of their natural destiny as mothers, nurturers of children and keepers of the family.” The rest of the letter is riddled with similar rhetoric. The second source is a letter to Nedelia (a popular Soviet weekly newspaper that covered society, culture, and politics) from a thirty-four-year-old woman, which states that “It is more pleasant by far for a husband if he is welcomed home from work by a wife with a kind smile and a hot, tasty meal, than by a super-bright wife with a dissertation and dining hall ticket in her hand.” The rhetoric of both letters is nearly identical, but Buckley mentions that letters contrasting such sentiment were also printed. However, those ideas were not the majority opinion in Soviet society. </p>
            <p class="post-text">One would expect the birth rate to be relatively high if keeping up with traditional standards in the Soviet Union. This was not the case, though, as Buckley argues that the pressures of a job and household labor made it overwhelming for women to have large families. The Soviet Union attempted to boost birth rates through provisions such as criminalizing abortion under Josef Stalin and increasing obstacles involved in seeking a divorce, also under Stalin. This also came with national recognition; Buckley states, "Women were awarded the title of Mother Heroine if they gave birth to, and brought up, ten children, " with other awards granted to women who raised five or more children. But, the birth rate continued to fall. This is due to the dilemma involving gender roles that Buckley presents: “Under current conditions, it seems that the Soviet leadership needs two kinds of women: economically active ones to participate in the labor force, and economically inactive ones to have large families. The dilemma is that it wants women to do both and theoretically be liberated simultaneously.”</p>
            <p class="post-text">Lastly, Buckley covers the political status of women in the Soviet Union. Because of their labor and household responsibilities, women lacked sufficient time to participate actively in politics. Even women who had the time to participate tended to remain at the bottom of the government hierarchy and had heavy constraints on upward mobility in this hierarchy. This is especially evident when analyzing the membership of the Communist Party, as there was a gross overrepresentation of males. To fight these injustices, some women advocated for women’s sects of the Party. Still, many argued against it, believing that such developments would create divisions in the working class and lead to ‘bourgeois feminism.’</p>
            <p class="post-text">Buckley now finishes her paper with an overview of what she has covered, with an overarching point: "The stress on the means to the achievement of communist ends has meant the postponement, even displacement, of some of these ends” (such ends being instant equality of sexes). Despite communist philosophy advocating for women's equality as a necessary aspect of proletarian liberation from the capital, it seems that either such philosophy has simplified the process to an extreme or that the Soviet government’s beliefs lacked a basis in communist philosophy.</p>
            <p class="post-text"><i>Mary Buckley is a researcher affiliated with Hughes Hall at the University of Cambridge. She specializes in Soviet and post-Soviet politics, society, history, and foreign policy. She also taught about such topics at the University of Edinburg for 17 years. At the end of this paper, it is stated that “Mary Buckley is writing a Ph. D thesis for Vanderbilt University on ideology and Soviet women. She is also working on Islam in Soviet Azerbaidzhan [sic] and recently spent six months in the USSR staying in Kyiv, Moscow, and Baku.” From this, I have discovered more of her works that interest me. The journal this article was published in, Feminist Review, is published by SAGE Publishing. SAGE is a credible publisher; SAGE publishes more than 1,000 journals and more than 800 books annually. This paper was written in 1981, roughly eight years before the fall of the Soviet Union. As a result, this introduces a gap in the Soviet history of women during the rule of Mikhail Gorbachev that this paper fails to cover simply because of how early it was written. This means I must seek another piece of evidence to fill that information gap. This information gap is especially pressing because of the liberal, laissez-faire economic policies passed under Gorbachev’s rule that likely had an enormous impact on the financial status/participation of women.</i></p>
        <h2 class="sub-heading">Carnaghan, Ellen, and Donna Bahry. “Political Attitudes and the Gender Gap in the USSR.” Comparative Politics, vol. 22, no. 4, July 1990, p. 379, https://doi.org/10.2307/421970.</h2>
        <p class="post-text">In its beginning paragraphs, this paper is mainly based on a survey of 2793 Soviet women and their attitudes towards different aspects of politics. Carnaghan et al. introduce more recent (in terms of 1990) ideas that women are more apathetic towards politics or more politically intolerant. However, they also cite that American studies imply women are more likely to support the Democratic Party and, as a result, support social welfare programs and oppose increased military spending. Many cite biological differences between men and women as the reason for this divide, claiming that “biology is destiny.” However, Carnaghan et al. argue that this fails to account for social conditioning and the heavily social aspect of traditional gender roles that lack basis in biology.</p>
        <p class="post-text">Carnaghan et al. now introduce the idea of gender differences in attitudes in the Soviet Union. Although all Soviet leaders claimed they had achieved equality for women, Soviet theorists began to realize that was not the case. Carnaghan et al. also argue that glasnost, a " transparency " policy introduced by Mikhail Gorbachev, exacerbated this gender inequality. However, data on Soviet women’s political attitudes is (at least, during 1990) limited compared to the abundance of research on Western women. Thus, Carnaghan et al. also want to draw some parallels between Soviet and Western women to make up for this lack of information. A parallel drawn by them involves the mechanisms of gender, as traditional roles of women seemed similar in both regions. However, because of the rise of feminism in the Western areas due to similar conditions, such as increased workforce participation, it could be safe to assume that positive attitudes toward feminism are/were prevalent in the Soviet Union. This paper and Buckley agree that occupational equality was not achieved in the Soviet Union, perhaps limiting the spread of such feminist ideas.</p>
        <p class="post-text">Now, a survey from the Soviet Interview Project is introduced. Carnaghan et al. notice some limitations; although the survey had many respondents and questions, the sample did not seem random, as 85 percent were Jewish, and most came from urban areas. From this data, Carnaghan et al. state that “both men and women with a college degree and those who came of political age after the Stalin period [were] more inclined toward a feminist viewpoint than [were] their older or less educated counterparts.” This introduces the variables of age and education into political attitudes. Additionally, in contrast to popular belief, this study found little correlation between support for social welfare and gender. However, they did find that women were less supportive of state control of industry, medicine, and agriculture, likely noting dissatisfaction with the state socialist government of the Soviet Union. Women also seemed more inclined to favor lower military spending on matters such as aid for the Allies in World War II, aid to Northern Vietnam during the Vietnam War, and 1968 intervention in Czechoslovakia. Another variable found is feminism, which deeply splits women's opinions. Women interested in feminism were/are “more interested in politics, more tolerant, more in favor of state control of the economy, and somewhat less opposed to higher defense spending.” Women with younger children also seemed to be more inclined towards feminist beliefs. Also, women in the Soviet Union, surprisingly, did not feel that they were discriminated against in education.</p>
        <p class="post-text">In conclusion, the attitudes of Soviet women seemed to be similar to those of Western women. However, some women did not fit this mold, which was in correlation to age, education, and, as a result, inclination to support feminism/hold feminist beliefs. This establishes a remarkable parallel between Soviet and Western women but cautions against generalizing all Soviet women to hold traditional beliefs as a majority.</p>
        <p class="post-text"><i>Ellen Carnaghan received a Ph.D. in political science from New York University and teaches at St. Louis University, a private and accredited research institution. Donna Bahry is a Professor Emerita of Political Science at Pennsylvania State University and earned a Ph.D. in political science from the University of Illinois, Urbana-Champaign. Both authors specialize in Soviet and post-Soviet politics and public opinion. Comparative Politics is a journal sponsored, edited, and published by the City University of New York. This information leads me to believe that this paper's authors and publisher(s) are quite reputable. However, for an in-depth analysis of Western women’s attitudes, I must look at the sources cited for this paper. I am glad that it covers the 8-year information gap brought by Buckley’s paper. </i></p>
        <h2 class="sub-heading">Schuster, Alice. “Women’s Role in the Soviet Union: Ideology and Reality.” Russian Review, vol. 30, no. 3, July 1971, pp. 260–67, https://doi.org/10.2307/128134.</h2>
        <p class="post-text">Written in 1971, the paper opens with the claim that “Nowadays, the Soviet Union leads the world in making use of the energies and talents of women,” which slightly contrasts with the views of authors Buckley and Carnaghan et al. Schuster cites this to be a result of communist ideology and its belief that the only path to female emancipation was through communism. She also cites the first Soviet constitution of 1918, which, in Article 22, established individual equality regardless of sex, race, or nationality. She also claims that Lenin advocated for the increased political participation of women so that they, en masse, would understand the inner workings of communism, especially the proletarian dictatorship. Schuster then argues that Stalin believed in similar principles, which also resulted in higher participation of women in the workforce and defense industry during the Second World War.</p>
        <p class="post-text">Similarly to Buckley, she mentions a “monopoly” in the medical industry; however, Schuster fails to immediately mention the imbalance women have in medical job hierarchies. However, she mentions this in the matter of women’s participation in government, as she states, “the higher reaches of the Communist Party have remained almost exclusively under male control.” She says that this is primarily because of traditional gender attitudes and women having to juggle household responsibilities with their careers. She also finally mentions a critique of Stalin and his views of women, referencing his abolishment of the Women's Section of the Central Committee of the Party. Critiques of the Soviet treatment of women also delve into the dilemmas mentioned by Buckley, as it seems that women were expected to be diligent caretakers at home while actively participating in the workforce. </p>
        <p class="post-text">Schuster now claims that “It is, therefore, at this point, dictated by the lack of respect for women in Russian culture, that the equality promised in the Constitution breaks down and the facts of daily Soviet life most sharply diverge from communist ideology.” Schuster evaluates this as a degeneration of the origins of Soviet Russia, referencing the ideas of Russian Revolution pioneer Vladimir Lenin and his concern for women's rights. Concluding her paper, Schuster solemnly reflects on such a situation, stating, “Indeed, in a sense, the position of many women probably has deteriorated because most women now have to work a double shift, one for the state and the other one at home for their husbands and families.”</p>
        <p class="post-text"><i>Alice Schuster is/was an assistant professor of history at Staten Island Community College of the City University of New York. I have yet to find any recent information on Schuster. The Russian Review is a peer-reviewed academic journal based on the politics of the Russian Federation, the Soviet Union, and the Russian Empire (all not existing in the present day). It is published by Wiley-Blackwell, a highly reputable John Wiley & Sons business.</i></p>
$ART_10$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  hero_image_url = EXCLUDED.hero_image_url,
  hero_image_caption = EXCLUDED.hero_image_caption,
  categories = EXCLUDED.categories,
  read_time = EXCLUDED.read_time,
  review_rating = EXCLUDED.review_rating,
  authors = EXCLUDED.authors,
  legacy_url = EXCLUDED.legacy_url,
  published = EXCLUDED.published,
  unlisted = EXCLUDED.unlisted,
  published_at = EXCLUDED.published_at,
  body_html = EXCLUDED.body_html;

-- 11. whistleblowers022924.html
INSERT INTO public.articles (
  slug,
  title,
  subtitle,
  hero_image_url,
  hero_image_caption,
  categories,
  read_time,
  review_rating,
  authors,
  post_type,
  legacy_url,
  published,
  unlisted,
  published_at,
  body_html
)
VALUES (
  'whistleblowers022924',
  'Unveiling Corruption: Whistleblowers and Ethical Governance',
  '“I want people to see the truth ... because without information you cannot make informed decisions as a public”.',
  'assets/images/featured/snowden.jpeg',
  'Edward Snowden''s Russian passport.',
  ARRAY['Ethics', 'Politics']::text[],
  '5 min read',
  NULL,
  '[{"name":"Sosa","avatar_url":"assets/images/authors/sosaicon1.png"}]'::jsonb,
  'standard',
  'articles/whistleblowers022924.html',
  true,
  false,
  '2024-02-29T12:00:00.000Z',
  $ART_11$
<h2 class="sub-heading">In 1971, Daniel Ellsberg released “The History of U.S. Decision-Making in Vietnam, 1945–1968”, now known as “The Pentagon Papers” to the media.</h2>
            <p class="post-text">This study focused on the contents of classified U.S. Department of Defense documents and shattered the illusion of government transparency in the realm of the Vietnam War. This included information meticulously detailing the inner workings and deceptions of successive U.S. presidential administrations (Truman, Eisenhower, Kennedy, and Johnson) regarding the Vietnam War. This created a credibility gap in journalism, as many Americans began to distrust official reports of the war; public opinion of involvement in Vietnam was already dwindling due to the Tet Offensive, but Ellsberg’s whistleblowing tanked it further.</p>
            <p class="post-text">Expectedly, the government had an unfavorable reaction to this; Ellsberg experienced not only the burglarizing of his psychiatric records by U.S. intelligence agents, but also illegal wiretapping by the Federal Bureau of Investigation. His experience laid the crucial framework for the future of government whistleblowers such as Chelsea Manning and Edward Snowden in the age of information and advanced warfare, strenuously searching for the truth while risking their livelihoods. Despite that risk, though, these individuals still dedicated themselves to notifying the public of the wrongdoings of their governments. Consequentially, government whistleblowers (especially in the United States) are essential for promoting transparency, accountability, and democratic governance in modern society. Thus, whistleblowers must not be unjustly vilified or silenced but rather recognized for their invaluable contributions to a more informed and democratic society.</p>
        <h2 class="sub-heading">In online correspondence, Chelsea Manning said,</h2>
        <p class="quote-text">
            <i class='bx bxs-quote-left'></i>
            I want people to see the truth, regardless of who they are, because without information you cannot make informed decisions as a public.
        </p>

            <p class="post-text">These words marked one of Manning’s clear motives for leaking the Iraq and Afghan War Logs, hundreds of thousands of diplomatic cables, and the infamous aerial footage of a Baghdad airstrike. These leaks provided a raw, unfiltered view of the conflicts, revealing incidents of civilian casualties and the callous attitudes of some military personnel involved. Manning's intention was not to incite chaos or undermine national security but rather to empower the public with knowledge that is essential for holding institutions accountable and shaping meaningful discourse on matters of war, diplomacy, and human rights.</p>
            <p class="post-text"><b>Moreover, Manning’s leaks were part of a larger movement catalyzed by WikiLeaks, spearheaded by Julian Assange.</b> Without Assange’s publication, Manning’s leaks would have never had a voice in the media. In addition to that, Assange's role through WikiLeaks has significantly contributed to promoting transparency and accountability globally. One notable example is the publication of the Guantanamo Files in 2011. These files, leaked by WikiLeaks, contained detailed information about the detainees held at the Guantanamo Bay detention camp, including their backgrounds, alleged activities, and the evidence (or lack thereof) against them. The release of these files brought attention to the controversial practices and lack of due process in the detention and interrogation of suspected terrorists, sparking international debate and scrutiny of the U.S. government's actions in the War on Terror.</p>
            <p class="post-text">As a result of the release of this material, public opinion has surely been affected in a similar way proceeding the release of “The Pentagon Papers”; a Pace University study based on online surveys and exposure to WikiLeaks articles showed <b>a noticeable decrease in trust for the government</b>. Hence, Manning's and Assange's efforts through WikiLeaks not only illuminate critical issues of human rights, but also fuel a movement towards greater transparency, as evidenced by the significant impact on public perception and trust in government institutions.</p>
        <h2 class="sub-heading">The existence of government whistleblowers also ensures accountability. </h2>
            <p class="post-text">During the early 1970s, the actions of the whistleblower known as "Deep Throat" in the Watergate scandal were instrumental in ensuring accountability within the government and uncovering widespread corruption at the highest levels of power. Deep Throat, later revealed to be Mark Felt, the Associate Director of the FBI at the time, provided crucial information to journalists at The Washington Post to uncover illegal activities within the Nixon administration. These activities included the burglary of the Democratic National Convention headquarters, wiretapping, and poor attempts to hide their involvement. The revelations from Felt's leaks triggered a cascade of investigations, congressional hearings, and legal proceedings that ultimately resulted in the resignation of President Richard Nixon. Felt’s courage and commitment to revealing the truth, despite the risks involved, exemplify the vital role whistleblowers play in uncovering wrongdoing and preserving the integrity of democratic institutions. </p>
            <p class="post-text">This event was echoed in 2013, when Edward Snowden leaked classified documents to journalists, exposing the vast scope of the National Security Agency's mass surveillance programs, including the collection of phone metadata of millions of Americans and global internet surveillance activities. Snowden's disclosures led to increased scrutiny and accountability mechanisms within the government, prompting congressional hearings, judicial reviews, and reforms aimed at enhancing transparency and oversight of surveillance practices. For instance, the USA Freedom Act, passed in 2015, imposed restrictions on bulk data collection and introduced measures for judicial review of surveillance requests. Both Edward Snowden and Deep Throat exemplify the bravery and moral conviction of whistleblowers who risked their careers to reveal wrongdoing and promote accountability within government institutions.</p>
        <h2 class="sub-heading">One accusatory concern of the existence of government whistleblowers is the supposed security risk they pose to global authorities; skeptics believe information leaks can harm the global interests of the United States.</h2>
            <p class="post-text">After Chelsea Manning’s immense number of leaks got out to the public, many believed such a revelation would lead to further increased tension in the Middle East and with U.S. allies. This same belief was paraded by the Department of Defense when it came to sentencing Manning, as the threat of decades behind bars was held above her head. Additionally, her pre-trial detention treatment was deemed “cruel, inhuman, and degrading” after a 14-month investigation by Juan Mendez, the (at the time) United Nations Special Rapporteur on Torture. However, a look at declassified documents obtained by BuzzFeed News under a Freedom of Information Act suit proves that the cruelty inflicted on Manning was without any true, desperate purpose. Although heavily redacted, what is clear in the report is that the Iraq leaks would have “no direct personal impact on current and former U.S. leadership in Iraq”. The same was said for U.S. operations in Afghan; despite the concern expressed in the document for “cooperative Afghans, Iraqis, and other foreign interlocutors”, no evidence since the entry and exit of U.S. troops in Afghanistan (2001-2021) has proved such to be a legitimate area of interest. The true effect of Manning’s bravery was the enlightenment of American citizens on wars authority misled them into supporting, but her harsh treatment suppressed the spread of such insight. </p>
            <p class="post-text">Furthermore, the reformative effect of whistleblowing can be clearly seen in, as described before, the passing of the USA Freedom Act because of Edward Snowden’s NSA leaks. Hence, the perceived concerns about security risks posed by government whistleblowers are unfounded, as evidenced by the lack of direct personal impact on national security from Manning's leaks and the subsequent positive impact on transparency and accountability through Snowden’s whistleblowing.</p>
        <h2 class="sub-heading">As all the above points have demonstrated, the legacy of government whistleblowers like Daniel Ellsberg, Chelsea Manning, Edward Snowden, and Mark Felt emphasize the role they have played in spreading transparency and accountability in governance.</h2>
            <p class="post-text">The actions of these individuals have shed light on administrative wrongdoing, led to reforms in law, and increased/affected the public perception of how much their leaders should be trusted. Nonetheless, despite these contributions, these whistleblowers still face vilification; as a result, society should not only recognize government whistleblowers, but also protect them in order to ensure they are not unjustly punished for their efforts to uphold ethical standards. As citizens, it is our responsibility to demand transparency and accountability from our governments. By advocating for forms of whistleblower protection and holding our elected officials accountable, we can contribute to a more democratic society for ourselves and future generations. Let us remember the words of Chelsea Manning, “I want people to see the truth, regardless of who they are, because without information you cannot make informed decisions as a public”. It is through transparency and access to information that we can ensure a government that serves the interests of the people.</p>
        <h2 class="sub-heading">Further Reading</h2>
            <p class="source">Gross, Terry. “How the Pentagon Papers Changed Public Perception of the War in Vietnam.” NPR.org, 18 June 2021, <a href="https://www.npr.org/2021/06/18/1007573283/how-the-pentagon-papers-changed-public-perception-of-the-war-in-vietnam">www.npr.org/2021/06/18/1007573283/how-the-pentagon-papers-changed-public-perception-of-the-war-in-vietnam.</a>
            <p class="source">Leigh, David, et al. “Guantánamo Leaks Lift Lid on World’s Most Controversial Prison.” <i>The Guardian</i>, 25 Apr. 2011, <a href="https://www.theguardian.com/world/2011/apr/25/guantanamo-files-lift-lid-prison">www.theguardian.com/world/2011/apr/25/guantanamo-files-lift-lid-prison.</a>
            <p class="source">Leigh, David, and Luke Harding. <i>WikiLeaks.</i> Guardian Books, 2011.
            <p class="source">Leopold, Jason. “Secret Report Contradicts US Position on Chelsea Manning Leaks.” <i>BuzzFeed News</i>, 20 June 2017, <a href="https://www.buzzfeednews.com/article/jasonleopold/secret-government-report-chelsea-manning-leaks-caused-no#.bfZJ7wWVW">www.buzzfeednews.com/article/jasonleopold/secret-government-report-chelsea-manning-leaks-caused-no#.bfZJ7wWVW.</a>
            <p class="source">Library of Congress. “Daniel Ellsberg and the Pentagon Papers | Crime, Corruption, and Cover-Ups | Library of Congress.” <i>Library of Congress</i>, Washington, D.C. 20540 USA, <a href="https://www.loc.gov/exhibitions/drawing-justice-courtroom-illustrations/about-this-exhibition/crime-corruption-and-cover-ups/daniel-ellsberg-and-the-pentagon-papers/">www.loc.gov/exhibitions/drawing-justice-courtroom-illustrations/about-this-exhibition/crime-corruption-and-cover-ups/daniel-ellsberg-and-the-pentagon-papers/.</a>
            <p class="source">Nakashima, Ellen. “With Deadline Near, Lawmakers Introduce Bill to End NSA Program.” <i>Washington Post</i>, 9 Apr. 2023, <a href="https://www.washingtonpost.com/world/national-security/with-deadline-near-lawmakers-introduce-bill-to-end-nsa-program/2015/04/28/8fd1cf6e-edb4-11e4-a55f-38924fca94f9_story.html">www.washingtonpost.com/world/national-security/with-deadline-near-lawmakers-introduce-bill-to-end-nsa-program/2015/04/28/8fd1cf6e-edb4-11e4-a55f-38924fca94f9_story.html</a>
            <p class="source">Nicks, Denver. <i>Private: Bradley Manning, Wikileaks, and the Biggest Exposure of Official Secrets in American History</i>. Chicago Review, 2012.
            <p class="source">Packer, George. “The Holder of Secrets.” <i>The New Yorker</i>, 10 Oct. 2014, <a href="https://www.newyorker.com/magazine/2014/10/20/holder-secrets">www.newyorker.com/magazine/2014/10/20/holder-secrets.</a>
            <p class="source">Pilkington, Ed. “Bradley Manning’s Treatment Was Cruel and Inhuman, UN Torture Chief Rules.” <i>The Guardian</i>, 12 Mar. 2012, <a href="https://www.theguardian.com/world/2012/mar/12/bradley-manning-cruel-inhuman-treatment-un">www.theguardian.com/world/2012/mar/12/bradley-manning-cruel-inhuman-treatment-un.</a>
            <p class="source">Sheehan, Neil. “Vietnam Archive: Pentagon Study Traces 3 Decades of Growing U. S. Involvement.” <i>The New York Times</i>, 13 June 1971, <a href="https://www.nytimes.com/1971/06/13/archives/vietnam-archive-pentagon-study-traces-3-decades-of-growing-u-s.html">www.nytimes.com/1971/06/13/archives/vietnam-archive-pentagon-study-traces-3-decades-of-growing-u-s.html.</a>
            <p class="source">Small, Hazel. <i>The Impact of Wikileaks on the Public Opinion of Online Privacy</i>. 2019, <a href="https://digitalcommons.pace.edu/cgi/viewcontent.cgi?article=1272&context=honorscollege_theses">digitalcommons.pace.edu/cgi/viewcontent.cgi?article=1272&context=honorscollege_theses.</a>
            <p class="source">“United States of America v. Felipe de Diego.” <i>Justia Law</i>, 16 Apr. 1975, <a href="https://law.justia.com/cases/federal/appellate-courts/F2/511/818/398519/">law.justia.com/cases/federal/appellate-courts/F2/511/818/398519/.</a>
            <p class="source">Woodward, Bob. <i>The Secret Man</i>. Simon and Schuster, 2012.
            </p>
$ART_11$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  hero_image_url = EXCLUDED.hero_image_url,
  hero_image_caption = EXCLUDED.hero_image_caption,
  categories = EXCLUDED.categories,
  read_time = EXCLUDED.read_time,
  review_rating = EXCLUDED.review_rating,
  authors = EXCLUDED.authors,
  legacy_url = EXCLUDED.legacy_url,
  published = EXCLUDED.published,
  unlisted = EXCLUDED.unlisted,
  published_at = EXCLUDED.published_at,
  body_html = EXCLUDED.body_html;
