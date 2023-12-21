
const mystyle = 
`
div.container.sidebar-right {
    display: flex;
    justify-content: space-around;
    padding: 0;
}


div[role='complementary'] {
    position: sticky;
    top: 0;
    overflow-y: auto;
    height: 100%;
    max-height: 1800px;
}

div[role='complementary']::-webkit-scrollbar {
    display: none;
}
`;

document.head.insertAdjacentHTML("beforeend", mystyle);
