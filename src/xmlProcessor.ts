import * as vscode from "vscode";
import { DOMParser } from "xmldom";

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
    this.engine = new EngineXML(this.dom.lastChild as Node);
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
      buffer.push(this.engine);
      return Promise.resolve(buffer);
    }
    return Promise.resolve([]);
  }



  parseXML() {
    let text: string;
    if (vscode.window.activeTextEditor) {
      text = vscode.window.activeTextEditor?.document.getText();
    } else {
      text = "";
    }
    this.dom = new DOMParser().parseFromString(text);
    this.engine = new EngineXML(this.dom.lastChild as Node);
  }

  onActiveEditorChanged(editor?: vscode.TextEditor) {
    if (editor) {
      if (editor.document.languageId === "xml") {
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
    return (element.nodeName);
  }

  static getXMLId(element: Node): string | undefined {
    if (element) {
      if ((element as any).attributes) {
        let attributeArray = (element as any).attributes;
        if (attributeArray.length > 0) {
          for (let i = 0; i < attributeArray.length; i++) {
            if (attributeArray[i].nodeName === "Id") {
              return attributeArray[i].nodeValue;
            }

          }
        }

      }
    }
  }

  static getXMLChild(element: Node): NodeListOf<ChildNode> {
    return element.childNodes;
  }

  activateView() {
    vscode.commands.executeCommand("setContext", "fileIsXML", true);

  }
  deactivateView() {
    vscode.commands.executeCommand("setContext", "fileIsXML", false);
  }

  static select(line: number) {
    line -= 1;
    let editor = vscode.window.activeTextEditor;
    if (editor) {
      vscode.window.showTextDocument(editor.document);
      let distance = (line) - editor.selection.start.line;
      if (distance !== 0) { 
        vscode.commands.executeCommand("cursorMove", {
          to: "down",
          by: "line",
          value: distance,
        });
        vscode.commands.executeCommand("cursorMove", {
          to: "wrappedLineFirstNonWhitespaceCharacter",
        });
      } else {
        editor.selection = new vscode.Selection(new vscode.Position(line, editor.document.lineAt(line).text.length), new vscode.Position(line, editor.document.lineAt(line).firstNonWhitespaceCharacterIndex));
      }
    }
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
    if (childNodes) {

      for (let i = 0; i < childNodes.length; i++) {
        if (childNodes[i].nodeType === childNodes[i].ELEMENT_NODE) {
          childList.push(new EngineXML(childNodes[i]));
          // if (vscode.window.activeTextEditor) {
          //   XMLOutlineProvider.select(
          //     vscode.window.activeTextEditor?.document.lineAt((this.node as any).lineNumber as number).range
          //   );
          // }
        }
      }
    }
    if (childList.length > 0) {
      this.child = childList;
      this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    this.label = this.tagName;
    this.description = this.xmlId;
    if (this.description) {
      this.tooltip = `${this.label} - ${this.description} - ${(this.node as any).lineNumber}`;
    } else {
      this.tooltip = `${this.label} - no id found- ${(this.node as any).lineNumber}`;
    }
    this.command = {
      command: "labster-xml-outliner.gotoline",
      title: "Go to line",
      arguments: [(this.node as any).lineNumber]
    };
  }
}

