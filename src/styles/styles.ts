export const baseStyles = `<style>@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

:host {
    display: block;
    font-family: Arial, sans-serif;
    border: 1px dotted #e0e0e0;
    border-radius: 8px;
    padding: 10px;
    max-width: 320px;
    box-sizing: border-box;
    height: auto;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}


h2 {
    margin: 0 0 12px;
    font-size: 1.25rem;
    text-align: center;
}

.quote {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 12px;
}

.section {
    margin-bottom: 5px;
}

.peril-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.material-icons {
    margin-right: 8px;
    color: #666;
    font-size: 20px;
    cursor: help;
}

.material-icons:hover {
    color: red
}

.protection-toggle {
    display: flex;
    justify-content: space-around;
    margin-top: 16px;
    padding: 12px;
    background-color: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.protection-toggle input[type="checkbox"] {
    margin-right: 8px;
    transform: scale(1.5);
    flex-grow: 1;
}

.protection-toggle label {
    font-weight: 500;
    cursor: pointer;
    user-select: none;
    flex-grow: 1;
}

#perils,
#links {
    display: flex;
    align-items: center;
    gap: 8px;
}

#links {
    font-size: 11px;
}

.links-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-around;
}

.perils-icons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
}

.peril-item {
    display: flex;
    align-items: center;
}

#underwriter {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 14px;
}

.underwriter-name {
    font-size: 12px;
    color: #666;
}

</style>`;


export const loadingStyles = `
<style>
    .loading {
    text-align: center;
    font-family: Arial, sans-serif;
    border: 1px dotted #e0e0e0;
    border-radius: 8px;
    padding: 10px;
    max-width: 320px;
    box-sizing: border-box;
    height: auto;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
</style>
`;