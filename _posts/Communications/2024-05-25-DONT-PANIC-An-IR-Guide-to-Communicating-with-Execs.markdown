---
title:  "DON'T PANIC! An IR Guide to Communicating with Execs"
date:   "2024-05-25 00:00:00 -0800"
categories: Communications
header:
 teaser: /assets/images/Communications/DontPanicTitle.png
---

![Title](/assets/images/Communications/DontPanicTitle.png)

In February of this year, my colleagues and I gave a talk at CactusCon 12 in Arizona. The topic we discussed was how to write executive communications regarding cybersecurity incidents. In this post I'll summarize that talk, discuss how to write a good report, and talk about the impact that a good or bad report can have.

## How to Communicate Cybersecurity Events to Executives
### What are we Talking About Here?
The scenario we wanted to explore is where the incident response team needs to produce an internal-facing report for executives and others outside of the security team during a cybersecurity incident.

For example, the CEO wants an update on what's happening during an active incident and they need it in 30 minutes - how do you explain what’s going on without unnecessarily freaking people out? (… or maybe freaking them out the appropriate amount)


### Writing Effective Reports
Ok, so you have to write a report updating people who may not know much about security at all on the status of a cybersecurity incident. What are some important things to pay attention to or think about while writing this report?

- **Remember your audience**
    - What level of expertise do they have?
        - It's almost certain that at least some of your audience doesn't have a great understanding of cybersecurity or even IT in general, so it is best to abstract away some of the technical detail to avoid having things lost in translation. 
    - What do they care about?
        - Executives care about impact to the business. Make sure that you clearly identify any customer, financial, reputational, or other kinds of business impact that have been realized as a result of this event.
- **Stick to the facts as you know them**
    - Wherever you can, try to avoid speculation. Report on things that you're certain about.
        - If you have to report something, but you're not absolutely sure about it, use qualifiers: "at this time", "likely", "probable", etc.
    - Don’t bring your feelings or opinions into the report.
- **Get rid of unnecessary detail**
    - Executives don't have a lot of time, so you need to keep the report short if you want them to actually read it.
    - In order to avoid having your audience tune out halfway through, try to avoid technical or industry jargon wherever you can.
- **Clear, concise writing is a skill**
    - Not everyone automatically has the ability to write a good report, especially when under time pressure, and that is okay. Everyone has their own skillset.
    - It can actually be extremely beneficial to bring in someone from outside your team who isn’t an expert but is a great writer and have them write the report in collaboration with someone from the incident response team.
        - This can help the team catch confusing language before it gets into the hands of executives.
    - Consider making a designated role for reporting during critical incident response activities.
- **Anticipate questions**
    - Put your executive hat on - what are some of the logical next questions they might ask based on your report?
        - Try to answer these questions before they’re asked.
- **Everyone Needs an Editor**
    - Avoid having reports authored and edited by the same person.
        - Everyone, even a professional journalist, needs an editor to make sure their writing makes sense to an outside audience.
    - Don’t take feedback or edits personally.
        - No one is going to get everything right on the first try and it's much better to have your team member suggest edits than to have those edits come from your executive management.


### Structuring a Report
Now you know what to think about, but how do you structure the report?

- **What happened?**
    - Remember to keep things very high-level. Remove detail.
- **What is the impact to the business?**
    - How many users are impacted?
    - What types of data were exposed and in what quantity?
    - Is there any direct financial loss?
    - etc.
- **What are we doing about it?**
    - This is where you can summarize incident response activities.
- **How are we making sure this doesn’t happen again?**
    - This is a section that you might not be able to report on right away.
    - After the incident is contained, you can start to think about establishing preventative and detective controls.



## Examples
### Example 1 | Too Technical
**Situation:** You are an incident responder at InfiniteProbability Technologies, Inc. and he organization was hit with a ransomware attack. The threat actor has encrypted systems and exfiltrated data.

**Original Text:**
> An APT utilized OSINT to pretext the TS hotline at InfiniteProbability. This resulted in domain admin, which allowed the APT to set up a C2 server and encrypt assets on the network using a 256-bit key and ChaCha20-Poly1305. Scattered Spider also exfiltrated PCI, NPII, and PII information while inhibiting system recovery (MITRE ATT&CK T1490). IR teams are eradicating the trojanized malware and obtaining forensic evidence for reverse-engineering.

This is obviously far too technical for an executive audience. The CEO isn't going to care about the encryption algorithm that was used to encrypt the files that the threat actor is holding for ransom. What they care about instead is that devices are unavailable and that data was exfiltrated and they want to know what we're doing about it.

**Edited Version:**
> A threat actor, Scattered Spider, utilized publicly available information to trick the technical support hotline. This allowed them to gain admin access and lock up devices on the network. The threat actor also exfiltrated sensitive information from 20,000 customers and 300 employees. The threat actor is preventing recovery of critical systems by destroying backups. The Incident Response team is working to collect evidence and remove the threat.

### Example 2 | Too Scary
**Situation:** You are an incident responder at InfiniteProbability Technologies, Inc. and a new zero-day vulnerability in a popular application from Vogon Technologies has been announced. 

**Original Text:**
> A new highly critical zero-day vulnerability in Vogon Technologies software has likely already been exploited on every internet-facing server in existence!!! One of our servers was compromised. This could result in all of our client-facing services being taken down, complete compromise of our entire network, and also will likely cause our stock prices to drop precipitously. I can already see protesters gathering outside the building!

Here, the author is embellishing the severity of this event and is speculating regarding the potential impact. If an executive got this report, it would likely cause them to react much more strongly than is actually warranted, causing additional work for the incident response team and likely resulting in a slowdown in the containment of the incident. This report needs to be re-focused onto the facts of the event.  

**Edited Version:**
> A new zero-day vulnerability in Vogon technologies has been announced. This vulnerability is already being exploited in the wild. Two InfiniteProbability devices are impacted by this vulnerability and one is showing signs of compromise. The Incident Response team immediately took this device offline and there is no sign of further compromise in the network. Teams are currently starting forensic investigation of the compromised device.

### Example 3 | No Action
**Situation:** You are an incident responder at InfiniteProbability Technologies, Inc. and a new zero-day vulnerability in the Somebody Else's Problem Field has been announced.

**Original Text:**
> A new vulnerability in the Somebody Else’s Problem (SEP) Field has been discovered. InfiniteProbability does not use this product, but some of the firm’s third-party vendors do. Hopefully they patch it soon, or else a lot of our customer’s sensitive data could be exposed.

This report explains what the event is, but doesn't talk at all about the impact or the actions that the incident response team is taking to address the event. An executive's next questions when recieving this report would most likely be "What are you doing about this and has have we been impacted yet?" We should address those questions before they ask them.

**Edited Version:**
> A new vulnerability in the Somebody Else’s Problem (SEP) Field has been discovered. InfiniteProbability does not use this product, but the firm’s third-party vendors do utilize SEP. The Incident Response team has engaged Vendor Management and requested that all critical vendors provide a detailed explanation of any impact that this vulnerability may have to InfiniteProbability data. At this time, there is no known impact to any company data or business processes.

### Example 4 | Downplaying
**Situation:** You are an incident responder at InfiniteProbability Technologies, Inc. and it has been discovered that the new Kill-O-Zap blasters have been misfiring due to a configuration error.

**Original Text:**
> It has come to the team’s attention that the default configuration of the new line of Kill-O-Zap blasters may result in misfires, though none have been reported at this time. No one uses the default configuration anyways, so we should be fine. Investigations did not discover any malicious threat. The misconfiguration has been corrected and overly permissive access to the configuration system was revoked.

If we think critically about this report, we can see that the author actually has the opposite problem from what we saw earlier - this time they are downplaying the impacts of an incident to levels where it is not communicating the true urgency of the event. We don't want to scare execeutives unnecessarily, but we also want to make sure that if there really is something serious going on, it gets the attention that it needs.

**Edited Version:**
> It has come to the team’s attention that the default configuration of the Kill-O-Zap blasters may result in misfires that could harm users or others. The configuration change was committed by a disgruntled ex-employee who maintained access to the system after termination. The misconfiguration has been corrected, the ex-employee’s access has been revoked, and the team is currently investigating any other systems that the employee may have accessed post-termination.


## Summary
Writing effective reports for executives is critical to ensure that the event recieves the appropriate response and support from management. This can make a significant difference in the overall business impact of a security event. As such, it is important to consider how to write executive reports in advance of the event itself. Here are some of the tips and tricks that we discussed above:

- **Writing tips**
    - Remember your audience
    - Get rid of unnecessary detail
    - Stick to the facts 
    - Clear, concise writing is a skill
    - Anticipate questions
    - Everyone needs an editor

- **Report Structure**
    - What happened?
    - What is the impact to the business?
    - What are we doing about it?
    - How are we making sure this doesn’t happen again?



## Livestream of the Talk at CactusCon 12
<iframe width="560" height="315" src="https://www.youtube.com/embed/W5iqIl7E_jE?si=9urS7MrcHROb-kx_" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>