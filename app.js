////////////////////////
// StartMenu Components
///////////////////////
function makeAppImageList(cname, arr, image_map){
    let item = ''
    arr.forEach(app => {
    item += `<div class="${cname}">
                <img src="${image_map[app][0]}" alt="${image_map[app[1]]}">
                <h3>${app}</h3> 
            </div>`
        }   
    );
    return item;
}
const image_map = new Map()
image_map.set("About Me", ["/Res/Tour XP.png", "about me app"]);
image_map.set("Resume", ["/Res/adobe-pdf-icon-logo-vector-01.png", "my resume app"]);
image_map.set("Projects", ["/Res/Appearance.png", "my projects app"]);
image_map.set("Contact Info", ["/Res/OE Send.png", "contact info app"]);
image_map.set("Media Player", ["/Res/dwsd58yvs5pe1.png", "media player app"]);
image_map.set("Music Player", ["/Res/MP3 player.png", "music player app"]);
image_map.set("Command Prompt", ["/Res/Command Prompt.png", "command prompt app"]);
image_map.set("Minessweeper", ["/Res/Minesweeper.png", "minesweeper aoo"]);
image_map.set("Notepad", ["/Res/Notepad.png", "notepad app"]);
image_map.set("Paint", ["/Res/Paint.png", "paint app"]);
image_map.set("Github", ["/Res/github-svgrepo-com.svg", "github link"]);
image_map.set("LinkedIn", ["/Res/linkedin-svgrepo-com.svg", "linkedin link"]);
image_map.set("Image Viewer", ["/Res/Windows Picture and Fax Viewer.png", "image viewer app"]);
image_map.set("Spider Solitaire", ["/Res/Spider Solitaire.png", "spider solitaire app"]);


class StartMenu extends HTMLElement{
    connectedCallback() {
        this.innerHTML = `
        <div>
            <div class="top_start_menu">
                <img src="/Res/Chess_Pieces.png" alt="user profile picture">
                <h2>Connor Dalley</h2>
            </div>
            <div class="middle_start_menu">
                <div class="left_start_menu"></div>
                    ${makeAppImageList("top_left_start", ["Resume", "Projects"], image_map)}
                    ${makeAppImageList("bottom_left_start", ["About Me", "Music Player", "Media Player", "Paint", "Notepad"], image_map)}
                <div class="right_menu">
                    ${makeAppImageList("top_right_start", ["Github", "LinkedIn"], image_map)}
                    ${makeAppImageList("bottom_right_start", ["Command Prompt", "Resume", "Minesweeper", "Spider Solitaire", "Image Viewer"])}
                </div>
            </div>
            <div class="bottom_start_menu">
            </div>
        </div>
        `;
    }
}
customElements.define("start_menu", StartMenu);

