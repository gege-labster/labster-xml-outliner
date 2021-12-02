import * as vscode from "vscode";
import {DOMParser} from "xmldom";

export class XMLOutlineProvider implements vscode.TreeDataProvider<EngineXML>{
  private dom;
  private engine;
  private _onDidChangeTreeData: vscode.EventEmitter<EngineXML | undefined | null | void> = new vscode.EventEmitter<EngineXML | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<EngineXML | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this.parseXML();
    this._onDidChangeTreeData.fire();
  }


  constructor(private context: vscode.ExtensionContext) {
    let text: string;
    if (vscode.window.activeTextEditor) {
      text = vscode.window.activeTextEditor?.document.getText();
    } else {
      text = "";
    }
    this.dom = new DOMParser().parseFromString(text);
    // console.log(this.dom.childNodes[0]);
    this.engine = new EngineXML(this.dom.childNodes[0]);
    vscode.window.onDidChangeActiveTextEditor(e => this.onActiveEditorChanged(e));
    vscode.workspace.onDidChangeTextDocument(e => this.onTextChanged(e));
    this.onActiveEditorChanged(vscode.window.activeTextEditor);
  }

  getTreeItem(element: EngineXML): vscode.TreeItem {
    return element;
  }

  getChildren(element?: EngineXML): Thenable<EngineXML[]> {
    // vscode.window.showInformationMessage('shits happen on get Children');
    if (element) {
      if (element.child) {
        return Promise.resolve(element.child);
      }
    } else {
      let buffer: EngineXML[] = [];
      console.log(buffer);
      buffer.push(this.engine);
      return Promise.resolve(buffer);
    }
    return Promise.resolve([]);
  }



  parseXML(){
    let text: string;
    if (vscode.window.activeTextEditor) {
      text = vscode.window.activeTextEditor?.document.getText();
    } else {
      text = "";
    }
    this.dom = new DOMParser().parseFromString(text);
    // console.log(this.dom.childNodes[0]);
    this.engine = new EngineXML(this.dom.childNodes[0]);
  }

  onActiveEditorChanged(editor?: vscode.TextEditor) {
    if (editor) {
      if (editor.document.languageId === "xml") {
        // console.log("activate view");
        this.activateView();
        this.refresh();
      } else {
        this.deactivateView();
      }
    }
  }
  onTextChanged(event: vscode.TextDocumentChangeEvent) {
    if (event.document === vscode.window.activeTextEditor?.document) {
      if (event.document.languageId === "xml") {
        this.refresh();
      }
    }
  }


  static getXMLTagName(element: Node): string {
    // console.log(element.nodeName);
    return (element.nodeName);
  }

  static getXMLId(element: Node): string | undefined {
    let attributeArray = (element as any).attributes;
    if (attributeArray.length > 0) {
      for (let i = 0; i < attributeArray.length; i++) {
        if (attributeArray[i].nodeName === "Id") {
          console.log("id found");
          return attributeArray[i].nodeValue;
        }
        
      }
    }
  }

  static getXMLChild(element: Node): NodeListOf<ChildNode> {
    // console.log(element.childNodes);
    return element.childNodes;
  }

  activateView() {
    vscode.commands.executeCommand("setContext", "fileIsXML", true);

  }
  deactivateView() {
    vscode.commands.executeCommand("setContext", "fileIsXML", false);
  }

}




class EngineXML extends vscode.TreeItem {
  public child?: EngineXML[];
  public tagName;
  public xmlId;
  public node;
  public lineNumber: number = 0;
  constructor(
    element: Node,
  ) {
    super("Placeholder");
    this.node = element;
    this.tagName = XMLOutlineProvider.getXMLTagName(this.node);
    this.xmlId = XMLOutlineProvider.getXMLId(this.node);
    
    let childList: EngineXML[] = [];
    let childNodes = XMLOutlineProvider.getXMLChild(this.node);
    for (let i = 0; i < childNodes.length; i++) {
      // console.log(childNodes[i].nodeType);
      if (childNodes[i].nodeType === childNodes[i].ELEMENT_NODE) {
        childList.push(new EngineXML(childNodes[i]));
      }
    }
    if (childList.length > 0) {
      this.child = childList;
      this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    this.label = this.tagName;
    this.description = this.xmlId;
    if (this.description) {
      this.tooltip = `${this.label} - ${this.description}`;
    } else {
      this.tooltip = `${this.label} - no id found`;
    }
  }
}

